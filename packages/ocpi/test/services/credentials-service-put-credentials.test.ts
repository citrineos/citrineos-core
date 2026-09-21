// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { TenantPartnerDto } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

import { CredentialsService } from '../../src/services/credentials-service.js';
import type { CredentialsDTO } from '../../src/types/dto/credentials-dto.js';
import { EndpointIdentifier } from '../../src/types/endpoint-identifier.js';
import { InterfaceRole } from '../../src/types/interface-role.js';
import { ModuleId } from '../../src/types/module-id.js';
import { Role } from '../../src/types/role.js';

const NEW_VERSIONS_URL = 'https://new.msp.test/ocpi/versions';
const NEW_VERSION_DETAILS_URL = 'https://new.msp.test/ocpi/2.2.1';

function aRegisteredPartner(): TenantPartnerDto {
  return {
    id: 3,
    countryCode: 'NL',
    partyId: 'MSP',
    tenant: {
      countryCode: 'GB',
      partyId: 'CPO',
      serverProfileOCPI: { credentialsRole: { role: 'CPO', businessDetails: { name: 'CPO' } } },
    },
    partnerProfileOCPI: {
      version: { version: '2.2.1', versionDetailsUrl: 'https://old.msp.test/ocpi/2.2.1' },
      serverCredentials: { versionsUrl: 'https://cpo.test/ocpi/versions', token: 'token-b' },
      credentials: { versionsUrl: 'https://old.msp.test/ocpi/versions', token: 'token-c' },
      endpoints: [
        {
          identifier: EndpointIdentifier.SESSIONS_RECEIVER,
          url: 'https://old.msp.test/ocpi/2.2.1/sessions',
        },
      ],
    },
  } as unknown as TenantPartnerDto;
}

function updatedCredentials(): CredentialsDTO {
  return {
    token: 'token-c2',
    url: NEW_VERSIONS_URL,
    roles: [
      {
        role: Role.EMSP,
        country_code: 'NL',
        party_id: 'MSP',
        business_details: { name: 'MSP' },
      },
    ],
  } as CredentialsDTO;
}

function aService(offeredVersion = '2.2.1') {
  const request = vi.fn().mockResolvedValue({});
  const versionsClientApi = {
    getVersions: vi
      .fn()
      .mockResolvedValue({ data: [{ version: offeredVersion, url: NEW_VERSION_DETAILS_URL }] }),
    getVersionDetails: vi.fn().mockResolvedValue({
      data: {
        version: '2.2.1',
        endpoints: [
          {
            identifier: ModuleId.Sessions,
            role: InterfaceRole.RECEIVER,
            url: 'https://new.msp.test/ocpi/2.2.1/sessions',
          },
          {
            identifier: ModuleId.Cdrs,
            role: InterfaceRole.RECEIVER,
            url: 'https://new.msp.test/ocpi/2.2.1/cdrs',
          },
        ],
      },
    }),
  };
  const service = new CredentialsService({
    logger: new Logger({ type: 'hidden' }),
    ocpiGraphqlClient: { request } as never,
    versionsClientApi: versionsClientApi as never,
    credentialsClientApi: {} as never,
  });
  return { service, request };
}

describe('CredentialsService.putCredentials', () => {
  it('stores the endpoints the partner publishes behind its new versions URL', async () => {
    const { service, request } = aService();

    await service.putCredentials(aRegisteredPartner(), updatedCredentials());

    const stored = request.mock.calls[0][1].input;
    expect(stored.endpoints).toEqual([
      {
        identifier: EndpointIdentifier.SESSIONS_RECEIVER,
        url: 'https://new.msp.test/ocpi/2.2.1/sessions',
      },
      { identifier: EndpointIdentifier.CDRS_RECEIVER, url: 'https://new.msp.test/ocpi/2.2.1/cdrs' },
    ]);
    expect(stored.version.versionDetailsUrl).toBe(NEW_VERSION_DETAILS_URL);
  });

  it('stores nothing when the new versions URL does not offer the registered version', async () => {
    const { service, request } = aService('2.1.1');

    await expect(
      service.putCredentials(aRegisteredPartner(), updatedCredentials()),
    ).rejects.toThrow();

    expect(request).not.toHaveBeenCalled();
  });
});
