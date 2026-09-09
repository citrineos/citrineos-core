// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from 'routing-controllers';

import { VersionService } from '../../src/services/version-service.js';
import { VersionNumber } from '../../src/model/version-number.js';
import { ModuleId } from '../../src/model/module-id.js';
import { InterfaceRole } from '../../src/model/interface-role.js';
import { GET_TENANT_BY_ID } from '../../src/graphql/index.js';

const TENANT_ID = 42;
const DETAILS_URL = 'https://cpo.example.com/ocpi/versions/2.2.1';
const CREDENTIALS_URL = 'https://cpo.example.com/ocpi/2.2.1/credentials';
const LOCATIONS_URL = 'https://cpo.example.com/ocpi/2.2.1/locations';

function aCapturingGraphqlClient(result: unknown) {
  const request = vi.fn().mockResolvedValue(result);
  return { client: { request } as never, request };
}

function aService(client: never) {
  return new VersionService({ ocpiGraphqlClient: client } as never);
}

function aTenantWith(serverProfileOCPI: unknown) {
  return { Tenants: [{ serverProfileOCPI, countryCode: 'GB', partyId: 'CPO' }] };
}

describe('VersionService.getVersions', () => {
  it('maps the stored version details to the version list', async () => {
    const { client, request } = aCapturingGraphqlClient(
      aTenantWith({
        versionDetails: [{ version: '2.2.1', versionDetailsUrl: DETAILS_URL }],
        versionEndpoints: {},
      }),
    );

    const response = await aService(client).getVersions(TENANT_ID);

    expect(request).toHaveBeenCalledOnce();
    expect(request.mock.calls[0][0]).toBe(GET_TENANT_BY_ID);
    expect(request.mock.calls[0][1]).toEqual({ id: TENANT_ID });
    expect(response.data).toEqual([
      { version: VersionNumber.TWO_DOT_TWO_DOT_ONE, url: DETAILS_URL },
    ]);
    // 1000 is GenericSuccessCode
    expect(response.status_code).toBe(1000);
    expect(response.timestamp).toBeInstanceOf(Date);
  });

  it('returns an empty list for a tenant without an OCPI server profile', async () => {
    const { client } = aCapturingGraphqlClient(aTenantWith(null));

    const response = await aService(client).getVersions(TENANT_ID);

    expect(response.data).toEqual([]);
    expect(response.status_code).toBe(1000);
  });

  it('returns an empty list when the profile has no version details', async () => {
    const { client } = aCapturingGraphqlClient(aTenantWith({ versionEndpoints: {} }));

    const response = await aService(client).getVersions(TENANT_ID);

    expect(response.data).toEqual([]);
  });

  it('rejects a stored version the mapper does not support', async () => {
    // Only 2.2.1 exists in OCPIVersionNumberEnum; anything else in the profile is bad data.
    const { client } = aCapturingGraphqlClient(
      aTenantWith({ versionDetails: [{ version: '2.1.1', versionDetailsUrl: DETAILS_URL }] }),
    );

    await expect(aService(client).getVersions(TENANT_ID)).rejects.toThrow(
      /Unsupported OCPI version 2\.1\.1/,
    );
  });

  it('propagates a graphql transport failure', async () => {
    const request = vi.fn().mockRejectedValue(new Error('hasura unreachable'));
    const service = aService({ request } as never);

    await expect(service.getVersions(TENANT_ID)).rejects.toThrow(/hasura unreachable/);
    expect(request).toHaveBeenCalledOnce();
  });
});

describe('VersionService.getVersionDetails', () => {
  it('maps the endpoints stored under the requested version', async () => {
    const { client, request } = aCapturingGraphqlClient(
      aTenantWith({
        versionDetails: [{ version: '2.2.1', versionDetailsUrl: DETAILS_URL }],
        versionEndpoints: {
          '2.2.1': [
            { identifier: 'credentials', url: CREDENTIALS_URL },
            { identifier: 'locations_SENDER', url: LOCATIONS_URL },
          ],
        },
      }),
    );

    const response = await aService(client).getVersionDetails(
      TENANT_ID,
      VersionNumber.TWO_DOT_TWO_DOT_ONE,
    );

    expect(request).toHaveBeenCalledOnce();
    expect(request.mock.calls[0][1]).toEqual({ id: TENANT_ID });
    expect(response.data).toEqual({
      version: VersionNumber.TWO_DOT_TWO_DOT_ONE,
      endpoints: [
        { identifier: ModuleId.Credentials, role: InterfaceRole.SENDER, url: CREDENTIALS_URL },
        { identifier: ModuleId.Locations, role: InterfaceRole.SENDER, url: LOCATIONS_URL },
      ],
    });
    expect(response.status_code).toBe(1000);
  });

  it('throws NotFoundError when the profile has no endpoints for the version', async () => {
    const { client } = aCapturingGraphqlClient(
      aTenantWith({ versionDetails: [], versionEndpoints: {} }),
    );

    await expect(
      aService(client).getVersionDetails(TENANT_ID, VersionNumber.TWO_DOT_TWO_DOT_ONE),
    ).rejects.toThrow(NotFoundError);
  });

  it('reports Version not found for a tenant without an OCPI server profile', async () => {
    const { client } = aCapturingGraphqlClient(aTenantWith(null));

    await expect(
      aService(client).getVersionDetails(TENANT_ID, VersionNumber.TWO_DOT_TWO_DOT_ONE),
    ).rejects.toThrow(/Version not found/);
  });

  it('rejects a requested version outside the supported set', async () => {
    // 2.2.1 endpoints exist, but the mapper only translates 2.2.1 into a lookup key.
    const { client } = aCapturingGraphqlClient(
      aTenantWith({
        versionEndpoints: { '2.2.1': [{ identifier: 'credentials', url: CREDENTIALS_URL }] },
      }),
    );

    await expect(
      aService(client).getVersionDetails(TENANT_ID, VersionNumber.TWO_DOT_ZERO),
    ).rejects.toThrow(/Unsupported version 2\.0/);
  });
});
