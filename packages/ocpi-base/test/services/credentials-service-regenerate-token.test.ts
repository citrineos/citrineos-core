// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { TenantPartnerDto } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

import { CredentialsService } from '../../src/services/credentials-service.js';
import type { AdminCredentialsRequestDTO } from '../../src/model/dto/admin-credentials-request-dto.js';
import { Role } from '../../src/model/role.js';
import { VersionNumber } from '../../src/model/version-number.js';

const PREVIOUS_SERVER_CREDENTIALS = {
  versionsUrl: 'https://cpo.test/ocpi/versions',
  token: 'token-b',
};

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
      version: { version: '2.2.1' },
      serverCredentials: { ...PREVIOUS_SERVER_CREDENTIALS },
      credentials: { versionsUrl: 'https://msp.test/ocpi/versions', token: 'token-c' },
    },
  } as unknown as TenantPartnerDto;
}

function aRegenerateRequest(): AdminCredentialsRequestDTO {
  return {
    url: 'https://cpo.test/ocpi/v2/versions',
    role: {
      role: Role.CPO,
      country_code: 'GB',
      party_id: 'CPO',
      business_details: { name: 'CPO' },
    },
    mspCountryCode: 'NL',
    mspPartyId: 'MSP',
  } as unknown as AdminCredentialsRequestDTO;
}

function aService(putCredentials: ReturnType<typeof vi.fn>) {
  const request = vi
    .fn()
    .mockResolvedValueOnce({ TenantPartners: [aRegisteredPartner()] })
    .mockResolvedValue({});
  const service = new CredentialsService({
    logger: new Logger({ type: 'hidden' }),
    ocpiGraphqlClient: { request } as never,
    versionsClientApi: {} as never,
    credentialsClientApi: { putCredentials } as never,
  });
  return { service, request };
}

function lastStoredProfile(request: ReturnType<typeof vi.fn>) {
  return request.mock.calls[request.mock.calls.length - 1][1].input;
}

describe('CredentialsService.regenerateCredentialsToken', () => {
  it('restores the previous server credentials when the partner rejects the PUT', async () => {
    const { service, request } = aService(
      vi.fn().mockRejectedValue(new Error('503 Service Unavailable')),
    );

    await expect(
      service.regenerateCredentialsToken(aRegenerateRequest(), VersionNumber.TWO_DOT_TWO_DOT_ONE),
    ).rejects.toThrow();

    expect(lastStoredProfile(request).serverCredentials).toEqual(PREVIOUS_SERVER_CREDENTIALS);
  });

  it('restores the previous server credentials when the partner answers without credentials', async () => {
    const { service, request } = aService(
      vi.fn().mockResolvedValue({ status_code: 2001, timestamp: new Date() }),
    );

    await expect(
      service.regenerateCredentialsToken(aRegenerateRequest(), VersionNumber.TWO_DOT_TWO_DOT_ONE),
    ).rejects.toThrow();

    expect(lastStoredProfile(request).serverCredentials).toEqual(PREVIOUS_SERVER_CREDENTIALS);
  });

  it('keeps the new server token when the partner accepts it', async () => {
    const { service, request } = aService(
      vi.fn().mockResolvedValue({
        status_code: 1000,
        timestamp: new Date(),
        data: {
          url: 'https://msp.test/ocpi/versions',
          token: 'token-c2',
          roles: [
            {
              role: Role.EMSP,
              country_code: 'NL',
              party_id: 'MSP',
              business_details: { name: 'MSP' },
            },
          ],
        },
      }),
    );

    const issued = await service.regenerateCredentialsToken(
      aRegenerateRequest(),
      VersionNumber.TWO_DOT_TWO_DOT_ONE,
    );

    const stored = lastStoredProfile(request);
    expect(stored.serverCredentials.token).toBe(issued.token);
    expect(stored.serverCredentials.token).not.toBe(PREVIOUS_SERVER_CREDENTIALS.token);
    expect(stored.credentials.token).toBe('token-c2');
  });
});
