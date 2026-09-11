// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

// Every flow that rotates a token calls uuid v4; pinned so mutations and DTOs
// can be asserted by exact value.
vi.mock('uuid', () => ({ v4: vi.fn(() => 'rotated-server-token') }));

import { CredentialsService } from '../../src/services/credentials-service.js';
import { VersionNumber } from '../../src/model/version-number.js';

const CPO_VERSIONS_URL = 'https://cpo.example.com/ocpi/versions';
const MSP_VERSIONS_URL = 'https://msp.example.com/ocpi/versions';
const MSP_DETAILS_URL = 'https://msp.example.com/ocpi/2.2.1';
const MSP_CREDENTIALS_URL = 'https://msp.example.com/ocpi/2.2.1/credentials';
const ROTATED_TOKEN = 'rotated-server-token';

const CPO_ROLE = {
  country_code: 'US',
  party_id: 'COS',
  role: 'CPO',
  business_details: { name: 'CitrineOS' },
};

const MSP_ROLE = {
  country_code: 'DE',
  party_id: 'MSP',
  role: 'EMSP',
  business_details: { name: 'Mock MSP' },
};

// Roles echoed back by the partner carry a different name so the second
// profile update is distinguishable from the first.
const MSP_ROLE_FROM_PARTNER = {
  country_code: 'DE',
  party_id: 'MSP',
  role: 'EMSP',
  business_details: { name: 'Mock MSP GmbH' },
};

function anUnregisteredProfile() {
  return {
    version: { version: '2.2.1' },
    serverCredentials: { versionsUrl: CPO_VERSIONS_URL, token: 'initial-server-token' },
  };
}

function aRegisteredProfile() {
  return {
    ...anUnregisteredProfile(),
    credentials: { versionsUrl: MSP_VERSIONS_URL, token: 'stored-partner-token' },
    roles: [{ role: 'EMSP', businessDetails: { name: 'Mock MSP' } }],
    endpoints: [{ identifier: 'credentials', url: MSP_CREDENTIALS_URL }],
  };
}

function aTenantPartner(profile: unknown) {
  return {
    id: 42,
    countryCode: 'DE',
    partyId: 'MSP',
    tenantId: 7,
    tenant: {
      id: 7,
      countryCode: 'US',
      partyId: 'COS',
      serverProfileOCPI: {
        credentialsRole: { role: 'CPO', businessDetails: { name: 'CitrineOS' } },
        versionDetails: [],
        versionEndpoints: {},
      },
    },
    partnerProfileOCPI: profile,
  };
}

/**
 * The service mutates a single profile object in place and hands the same
 * reference to every mutation, so variables are cloned at call time; log
 * records the cross-dependency call order.
 */
function aHarness(partner?: unknown) {
  const log: string[] = [];
  const graphqlCalls: { document: string; variables: any }[] = [];
  const request = vi.fn(async (document: unknown, variables: unknown) => {
    const text = String(document);
    graphqlCalls.push({ document: text, variables: structuredClone(variables) });
    if (text.includes('query GetTenantPartnerByCpoClientAndModuleId')) {
      log.push('graphql:getPartner');
      return { TenantPartners: [partner] };
    }
    if (text.includes('mutation UpdateTenantPartnerProfile')) {
      log.push('graphql:updateProfile');
      return { update_TenantPartners: { affected_rows: 1 } };
    }
    if (text.includes('mutation DeleteTenantPartnerByServerToken')) {
      log.push('graphql:deleteByServerToken');
      return { delete_TenantPartners: { affected_rows: 1 } };
    }
    if (text.includes('mutation DeleteTenantPartnerById')) {
      log.push('graphql:deleteById');
      return { delete_TenantPartners: { affected_rows: 1 } };
    }
    throw new Error('Unexpected graphql document: ' + text);
  });
  const versionsClientApi = {
    getVersions: vi.fn(async (..._args: unknown[]) => {
      log.push('versions:getVersions');
      return {
        data: [
          { version: '2.2.1', url: MSP_DETAILS_URL },
          { version: '2.1.1', url: 'https://msp.example.com/ocpi/2.1.1' },
        ],
      };
    }),
    getVersionDetails: vi.fn(async (..._args: unknown[]) => {
      log.push('versions:getVersionDetails');
      return {
        data: {
          version: '2.2.1',
          endpoints: [{ identifier: 'credentials', role: 'RECEIVER', url: MSP_CREDENTIALS_URL }],
        },
      };
    }),
  };
  const credentialsClientApi = {
    postCredentials: vi.fn(async (..._args: unknown[]) => {
      log.push('credentials:postCredentials');
      return { data: { token: 'token-c', url: MSP_VERSIONS_URL, roles: [MSP_ROLE_FROM_PARTNER] } };
    }),
    putCredentials: vi.fn(async (..._args: unknown[]) => {
      log.push('credentials:putCredentials');
      return {
        data: {
          token: 'partner-rotated-token',
          url: MSP_VERSIONS_URL,
          roles: [MSP_ROLE_FROM_PARTNER],
        },
      };
    }),
    deleteCredentials: vi.fn(async (..._args: unknown[]) => {
      log.push('credentials:deleteCredentials');
      return {};
    }),
  };
  const service = new CredentialsService({
    logger: new Logger({ type: 'hidden' }),
    ocpiGraphqlClient: { request },
    versionsClientApi,
    credentialsClientApi,
  } as never);
  return { service, request, graphqlCalls, log, versionsClientApi, credentialsClientApi };
}

function updateCalls(graphqlCalls: { document: string; variables: any }[]) {
  return graphqlCalls.filter((c) => c.document.includes('mutation UpdateTenantPartnerProfile'));
}

describe('registerCredentialsTokenA', () => {
  const tokenACredentials = () => ({
    token: 'token-a',
    url: MSP_VERSIONS_URL,
    roles: [MSP_ROLE],
  });

  function register(
    harness: ReturnType<typeof aHarness>,
    version = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ) {
    return harness.service.registerCredentialsTokenA(
      'US',
      'COS',
      CPO_VERSIONS_URL,
      tokenACredentials() as never,
      version,
    );
  }

  it('exchanges token A for token C across both partner calls and profile updates', async () => {
    const h = aHarness(aTenantPartner(anUnregisteredProfile()));

    const result = await register(h);

    expect(h.log).toEqual([
      'graphql:getPartner',
      'versions:getVersions',
      'versions:getVersionDetails',
      'graphql:updateProfile',
      'credentials:postCredentials',
      'graphql:updateProfile',
    ]);
    expect(result).toEqual({
      token: 'token-c',
      url: MSP_VERSIONS_URL,
      roles: [MSP_ROLE_FROM_PARTNER],
    });
  });

  it('looks the partner up by CPO and the country/party of the first role', async () => {
    const h = aHarness(aTenantPartner(anUnregisteredProfile()));

    await register(h);

    expect(h.graphqlCalls[0].document).toContain('query GetTenantPartnerByCpoClientAndModuleId');
    expect(h.graphqlCalls[0].variables).toEqual({
      cpoCountryCode: 'US',
      cpoPartyId: 'COS',
      clientCountryCode: 'DE',
      clientPartyId: 'MSP',
    });
  });

  it('walks versions from the URL in the credentials, then the matched version details URL', async () => {
    const h = aHarness(aTenantPartner(anUnregisteredProfile()));

    await register(h);

    expect(h.versionsClientApi.getVersions).toHaveBeenCalledOnce();
    expect(h.versionsClientApi.getVersions.mock.calls[0].slice(0, 4)).toEqual([
      'US',
      'COS',
      'DE',
      'MSP',
    ]);
    expect(h.versionsClientApi.getVersions.mock.calls[0][5]).toBe(MSP_VERSIONS_URL);
    expect(h.versionsClientApi.getVersionDetails).toHaveBeenCalledOnce();
    expect(h.versionsClientApi.getVersionDetails.mock.calls[0][5]).toBe(MSP_DETAILS_URL);
  });

  it('stores token A plus endpoints first, then replaces token A with token C', async () => {
    const h = aHarness(aTenantPartner(anUnregisteredProfile()));

    await register(h);

    const [first, second] = updateCalls(h.graphqlCalls);
    expect(first.variables.partnerId).toBe(42);
    expect(first.variables.input.credentials).toEqual({
      versionsUrl: MSP_VERSIONS_URL,
      token: 'token-a',
    });
    expect(first.variables.input.serverCredentials).toEqual({
      versionsUrl: CPO_VERSIONS_URL,
      token: ROTATED_TOKEN,
    });
    expect(first.variables.input.endpoints).toEqual([
      { identifier: 'credentials', url: MSP_CREDENTIALS_URL },
    ]);
    expect(first.variables.input.version.versionDetailsUrl).toBe(MSP_DETAILS_URL);
    expect(second.variables.input.credentials).toEqual({
      versionsUrl: MSP_VERSIONS_URL,
      token: 'token-c',
    });
    expect(second.variables.input.roles).toEqual([
      { role: 'EMSP', businessDetails: { name: 'Mock MSP GmbH' } },
    ]);
  });

  it('posts its own credentials carrying the fresh token B', async () => {
    const h = aHarness(aTenantPartner(anUnregisteredProfile()));

    await register(h);

    expect(h.credentialsClientApi.postCredentials).toHaveBeenCalledOnce();
    const args = h.credentialsClientApi.postCredentials.mock.calls[0] as any[];
    expect(args.slice(0, 4)).toEqual(['US', 'COS', 'DE', 'MSP']);
    expect(args[5]).toEqual({
      token: ROTATED_TOKEN,
      url: CPO_VERSIONS_URL,
      roles: [CPO_ROLE],
    });
  });

  it('rejects a partner that already holds credentials', async () => {
    const h = aHarness(aTenantPartner(aRegisteredProfile()));

    await expect(register(h)).rejects.toThrow('Already registered');
    expect(h.versionsClientApi.getVersions).not.toHaveBeenCalled();
    expect(updateCalls(h.graphqlCalls)).toHaveLength(0);
  });

  it('rejects a version other than the one stored on the profile', async () => {
    const h = aHarness(aTenantPartner(anUnregisteredProfile()));

    await expect(register(h, VersionNumber.TWO_DOT_TWO)).rejects.toThrow(
      'TenantPartner expects 2.2.1, received 2.2',
    );
    expect(h.versionsClientApi.getVersions).not.toHaveBeenCalled();
  });

  it('fails before any write when the partner versions endpoint yields nothing', async () => {
    const h = aHarness(aTenantPartner(anUnregisteredProfile()));
    h.versionsClientApi.getVersions.mockResolvedValue(undefined as never);

    await expect(register(h)).rejects.toThrow(
      'Versions list response was null or did not have expected data',
    );
    expect(updateCalls(h.graphqlCalls)).toHaveLength(0);
  });

  it('fails when the partner does not offer the stored version', async () => {
    const h = aHarness(aTenantPartner(anUnregisteredProfile()));
    h.versionsClientApi.getVersions.mockResolvedValue({
      data: [{ version: '2.1.1', url: 'https://msp.example.com/ocpi/2.1.1' }],
    });

    await expect(register(h)).rejects.toThrow('Matching version not found');
    expect(h.versionsClientApi.getVersionDetails).not.toHaveBeenCalled();
  });

  it('fails when the version details response has no data', async () => {
    const h = aHarness(aTenantPartner(anUnregisteredProfile()));
    h.versionsClientApi.getVersionDetails.mockResolvedValue({} as never);

    await expect(register(h)).rejects.toThrow('Matching version details not found');
    expect(updateCalls(h.graphqlCalls)).toHaveLength(0);
  });

  it('stops after the first update when the partner returns no token C', async () => {
    const h = aHarness(aTenantPartner(anUnregisteredProfile()));
    h.credentialsClientApi.postCredentials.mockResolvedValue({
      data: { url: MSP_VERSIONS_URL, roles: [MSP_ROLE_FROM_PARTNER] },
    } as never);

    await expect(register(h)).rejects.toThrow('Token C not found in credentials response');
    expect(updateCalls(h.graphqlCalls)).toHaveLength(1);
  });
});

describe('postCredentials', () => {
  const incoming = () => ({
    token: 'partner-token-b',
    url: MSP_VERSIONS_URL,
    roles: [MSP_ROLE],
  });

  it('stores the partner credentials and endpoints and answers with a rotated server token', async () => {
    const partner = aTenantPartner(anUnregisteredProfile());
    const h = aHarness(partner);

    const result = await h.service.postCredentials(
      partner as never,
      incoming() as never,
      VersionNumber.TWO_DOT_TWO_DOT_ONE,
    );

    expect(h.log).toEqual([
      'versions:getVersions',
      'versions:getVersionDetails',
      'graphql:updateProfile',
    ]);
    expect(h.versionsClientApi.getVersions.mock.calls[0][5]).toBe(MSP_VERSIONS_URL);
    const [update] = updateCalls(h.graphqlCalls);
    expect(update.variables.partnerId).toBe(42);
    expect(update.variables.input.credentials).toEqual({
      versionsUrl: MSP_VERSIONS_URL,
      token: 'partner-token-b',
    });
    expect(update.variables.input.serverCredentials).toEqual({
      versionsUrl: CPO_VERSIONS_URL,
      token: ROTATED_TOKEN,
    });
    expect(update.variables.input.roles).toEqual([
      { role: 'EMSP', businessDetails: { name: 'Mock MSP' } },
    ]);
    expect(update.variables.input.endpoints).toEqual([
      { identifier: 'credentials', url: MSP_CREDENTIALS_URL },
    ]);
    expect(result).toEqual({ token: ROTATED_TOKEN, url: CPO_VERSIONS_URL, roles: [CPO_ROLE] });
  });

  it('rejects a second registration', async () => {
    const partner = aTenantPartner(aRegisteredProfile());
    const h = aHarness(partner);

    await expect(
      h.service.postCredentials(
        partner as never,
        incoming() as never,
        VersionNumber.TWO_DOT_TWO_DOT_ONE,
      ),
    ).rejects.toThrow('Already registered');
    expect(h.request).not.toHaveBeenCalled();
  });

  it('rejects a version mismatch before contacting the partner', async () => {
    const partner = aTenantPartner(anUnregisteredProfile());
    const h = aHarness(partner);

    await expect(
      h.service.postCredentials(partner as never, incoming() as never, VersionNumber.TWO_DOT_TWO),
    ).rejects.toThrow('TenantPartner expects 2.2.1, received 2.2');
    expect(h.versionsClientApi.getVersions).not.toHaveBeenCalled();
    expect(h.request).not.toHaveBeenCalled();
  });
});

describe('putCredentials', () => {
  it('rotates the server token and stores the new partner credentials without re-fetching versions', async () => {
    const partner = aTenantPartner(aRegisteredProfile());
    const h = aHarness(partner);
    const incoming = {
      token: 'new-partner-token',
      url: 'https://msp.example.com/ocpi/v2/versions',
      roles: [MSP_ROLE],
    };

    const result = await h.service.putCredentials(partner as never, incoming as never);

    expect(h.versionsClientApi.getVersions).not.toHaveBeenCalled();
    expect(h.request).toHaveBeenCalledOnce();
    const [update] = updateCalls(h.graphqlCalls);
    expect(update.variables.partnerId).toBe(42);
    expect(update.variables.input.credentials).toEqual({
      versionsUrl: 'https://msp.example.com/ocpi/v2/versions',
      token: 'new-partner-token',
    });
    expect(update.variables.input.serverCredentials.token).toBe(ROTATED_TOKEN);
    expect(result.token).toBe(ROTATED_TOKEN);
  });

  it('rejects rotation for a partner that never registered', async () => {
    const partner = aTenantPartner(anUnregisteredProfile());
    const h = aHarness(partner);

    await expect(
      h.service.putCredentials(partner as never, { roles: [] } as never),
    ).rejects.toThrow('Not registered');
    expect(h.request).not.toHaveBeenCalled();
  });
});

describe('deleteCredentials', () => {
  it('deletes the tenant partner matching the server token', async () => {
    const h = aHarness();

    await h.service.deleteCredentials('token-b');

    expect(h.request).toHaveBeenCalledOnce();
    expect(h.graphqlCalls[0].document).toContain('mutation DeleteTenantPartnerByServerToken');
    expect(h.graphqlCalls[0].variables).toEqual({ serverToken: 'token-b' });
  });

  it('reports an unknown token as not found', async () => {
    const h = aHarness();
    h.request.mockResolvedValueOnce({ delete_TenantPartners: { affected_rows: 0 } });

    await expect(h.service.deleteCredentials('unknown-token')).rejects.toThrow(
      'No client information found for the provided token',
    );
    expect(h.request).toHaveBeenCalledOnce();
  });
});

describe('unregisterClient', () => {
  it('tells the partner to drop our credentials, then deletes the local row', async () => {
    const h = aHarness(aTenantPartner(aRegisteredProfile()));

    await h.service.unregisterClient({
      serverCountryCode: 'US',
      serverPartyId: 'COS',
      clientCountryCode: 'DE',
      clientPartyId: 'MSP',
    } as never);

    expect(h.log).toEqual([
      'graphql:getPartner',
      'credentials:deleteCredentials',
      'graphql:deleteById',
    ]);
    expect(h.graphqlCalls[0].variables).toEqual({
      cpoCountryCode: 'US',
      cpoPartyId: 'COS',
      clientCountryCode: 'DE',
      clientPartyId: 'MSP',
    });
    expect(h.credentialsClientApi.deleteCredentials).toHaveBeenCalledOnce();
    expect(h.credentialsClientApi.deleteCredentials.mock.calls[0].slice(0, 4)).toEqual([
      'US',
      'COS',
      'DE',
      'MSP',
    ]);
    expect(h.graphqlCalls[1].document).toContain('mutation DeleteTenantPartnerById');
    expect(h.graphqlCalls[1].variables).toEqual({ id: 42 });
  });
});

describe('generateCredentialsTokenA', () => {
  const adminRequest = () => ({
    url: CPO_VERSIONS_URL,
    role: CPO_ROLE,
    mspCountryCode: 'DE',
    mspPartyId: 'MSP',
  });

  it('creates a fresh profile carrying token A and the requested version', async () => {
    const h = aHarness(aTenantPartner(undefined));

    const result = await h.service.generateCredentialsTokenA(
      adminRequest() as never,
      VersionNumber.TWO_DOT_TWO_DOT_ONE,
    );

    expect(h.graphqlCalls[0].variables).toEqual({
      cpoCountryCode: 'US',
      cpoPartyId: 'COS',
      clientCountryCode: 'DE',
      clientPartyId: 'MSP',
    });
    expect(updateCalls(h.graphqlCalls)).toHaveLength(1);
    expect(h.graphqlCalls[1].variables).toEqual({
      partnerId: 42,
      input: {
        serverCredentials: { versionsUrl: CPO_VERSIONS_URL, token: ROTATED_TOKEN },
        version: { version: '2.2.1' },
      },
    });
    expect(result).toEqual({ token: ROTATED_TOKEN, url: CPO_VERSIONS_URL, roles: [CPO_ROLE] });
  });

  it('refuses when the partner already has a profile', async () => {
    const h = aHarness(aTenantPartner(anUnregisteredProfile()));

    await expect(
      h.service.generateCredentialsTokenA(
        adminRequest() as never,
        VersionNumber.TWO_DOT_TWO_DOT_ONE,
      ),
    ).rejects.toThrow(/already has credentials token A/);
    expect(updateCalls(h.graphqlCalls)).toHaveLength(0);
  });
});

describe('regenerateCredentialsToken', () => {
  const NEW_CPO_VERSIONS_URL = 'https://cpo.example.com/ocpi/v2.2.1/versions';
  const adminRequest = () => ({
    url: NEW_CPO_VERSIONS_URL,
    role: CPO_ROLE,
    mspCountryCode: 'DE',
    mspPartyId: 'MSP',
  });

  it('stores the rotated token, pushes it to the partner, then stores the partner reply', async () => {
    const h = aHarness(aTenantPartner(aRegisteredProfile()));

    const result = await h.service.regenerateCredentialsToken(
      adminRequest() as never,
      VersionNumber.TWO_DOT_TWO_DOT_ONE,
    );

    expect(h.log).toEqual([
      'graphql:getPartner',
      'graphql:updateProfile',
      'credentials:putCredentials',
      'graphql:updateProfile',
    ]);
    const [first, second] = updateCalls(h.graphqlCalls);
    expect(first.variables.input.serverCredentials).toEqual({
      versionsUrl: NEW_CPO_VERSIONS_URL,
      token: ROTATED_TOKEN,
    });
    expect(first.variables.input.version.version).toBe('2.2.1');
    const putArgs = h.credentialsClientApi.putCredentials.mock.calls[0] as any[];
    expect(putArgs.slice(0, 4)).toEqual(['US', 'COS', 'DE', 'MSP']);
    expect(putArgs[5]).toEqual({
      token: ROTATED_TOKEN,
      url: NEW_CPO_VERSIONS_URL,
      roles: [CPO_ROLE],
    });
    expect(second.variables.input.credentials).toEqual({
      versionsUrl: MSP_VERSIONS_URL,
      token: 'partner-rotated-token',
    });
    expect(result).toEqual({ token: ROTATED_TOKEN, url: NEW_CPO_VERSIONS_URL, roles: [CPO_ROLE] });
  });

  it('wraps a partner failure in an InternalServerError', async () => {
    const h = aHarness(aTenantPartner(aRegisteredProfile()));
    h.credentialsClientApi.putCredentials.mockRejectedValue(new Error('partner unreachable'));

    await expect(
      h.service.regenerateCredentialsToken(
        adminRequest() as never,
        VersionNumber.TWO_DOT_TWO_DOT_ONE,
      ),
    ).rejects.toThrow(/Regenerate credentials token failed/);
    // The first update ran before the partner call; the reply update never did.
    expect(updateCalls(h.graphqlCalls)).toHaveLength(1);
  });
});

describe('getCredentials', () => {
  it('builds the DTO from the stored server credentials and the tenant credentials role', async () => {
    const partner = aTenantPartner(aRegisteredProfile());
    const h = aHarness(partner);

    const dto = await h.service.getCredentials(partner as never);

    expect(dto).toEqual({
      token: 'initial-server-token',
      url: CPO_VERSIONS_URL,
      roles: [CPO_ROLE],
    });
    expect(h.request).not.toHaveBeenCalled();
  });
});
