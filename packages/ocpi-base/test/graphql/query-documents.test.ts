// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => vi.fn());

// Only GraphQLClient is replaced; `gql` stays real so the query modules below
// still produce their document strings.
vi.mock('graphql-request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('graphql-request')>();
  return {
    ...actual,
    GraphQLClient: vi.fn().mockImplementation(function () {
      return { request: requestMock };
    }),
  };
});

import { GraphQLClient } from 'graphql-request';
import { OcpiGraphqlClient } from '../../src/graphql/ocpi-graphql-client.js';
import {
  GET_CHARGING_STATION_BY_ID_QUERY,
  GET_CHARGING_STATION_BY_PK_QUERY,
} from '../../src/graphql/queries/charging-station-queries.js';
import {
  GET_SEQUENCE,
  UPSERT_SEQUENCE,
} from '../../src/graphql/queries/charging-station-sequence-queries.js';
import {
  GET_CONNECTOR_BY_ID_QUERY,
  GET_EVSE_BY_ID_QUERY,
  GET_LOCATION_BY_ID_QUERY,
  GET_LOCATIONS_QUERY,
} from '../../src/graphql/queries/location-queries.js';
import {
  GET_TARIFF_BY_KEY_QUERY,
  GET_TARIFFS_QUERY,
} from '../../src/graphql/queries/tariff-queries.js';
import {
  DELETE_TENANT_PARTNER_BY_ID,
  UPDATE_TENANT_PARTNER_PROFILE,
} from '../../src/graphql/queries/tenant-mutations.js';
import {
  DELETE_TENANT_PARTNER_BY_SERVER_TOKEN,
  GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT,
  GET_TENANT_PARTNER_BY_ID,
  GET_TENANT_PARTNER_BY_SERVER_TOKEN,
  LIST_TENANT_PARTNERS_BY_CPO,
} from '../../src/graphql/queries/tenant-partner-queries.js';
import { GET_TENANT_BY_ID } from '../../src/graphql/queries/tenant-version-endpoints-queries.js';
import {
  CREATE_AUTHORIZATION_MUTATION,
  GET_AUTHORIZATION_BY_ID,
  GET_AUTHORIZATION_BY_TOKEN,
  GET_GROUP_AUTHORIZATION,
  READ_AUTHORIZATION,
  UPDATE_TOKEN_MUTATION,
} from '../../src/graphql/queries/token-queries.js';
import {
  GET_ACTIVE_TRANSACTION_FOR_STOP_SESSION_QUERY,
  GET_TRANSACTION_BY_ID_QUERY,
  GET_TRANSACTIONS_QUERY,
} from '../../src/graphql/queries/transaction-queries.js';

const PARTY_SCOPE = 'Tenant: { countryCode: { _eq: $countryCode }, partyId: { _eq: $partyId } }';

describe('operation names', () => {
  // One row per live export in src/graphql/queries. A rename here breaks
  // Hasura persisted-operation logs, so the names are pinned.
  it.each([
    [
      'GET_CHARGING_STATION_BY_PK_QUERY',
      GET_CHARGING_STATION_BY_PK_QUERY,
      'query GetChargingStationByPk(',
    ],
    [
      'GET_CHARGING_STATION_BY_ID_QUERY',
      GET_CHARGING_STATION_BY_ID_QUERY,
      'query GetChargingStationById(',
    ],
    ['GET_SEQUENCE', GET_SEQUENCE, 'query GetSequence('],
    ['UPSERT_SEQUENCE', UPSERT_SEQUENCE, 'mutation UpsertSequence('],
    ['GET_LOCATIONS_QUERY', GET_LOCATIONS_QUERY, 'query GetLocations('],
    ['GET_LOCATION_BY_ID_QUERY', GET_LOCATION_BY_ID_QUERY, 'query GetLocationById('],
    ['GET_EVSE_BY_ID_QUERY', GET_EVSE_BY_ID_QUERY, 'query GetEvseById('],
    ['GET_CONNECTOR_BY_ID_QUERY', GET_CONNECTOR_BY_ID_QUERY, 'query GetConnectorById('],
    ['GET_TARIFF_BY_KEY_QUERY', GET_TARIFF_BY_KEY_QUERY, 'query GetTariffByKey('],
    ['GET_TARIFFS_QUERY', GET_TARIFFS_QUERY, 'query GetTariffs('],
    [
      'UPDATE_TENANT_PARTNER_PROFILE',
      UPDATE_TENANT_PARTNER_PROFILE,
      'mutation UpdateTenantPartnerProfile(',
    ],
    [
      'DELETE_TENANT_PARTNER_BY_ID',
      DELETE_TENANT_PARTNER_BY_ID,
      'mutation DeleteTenantPartnerById(',
    ],
    [
      'GET_TENANT_PARTNER_BY_SERVER_TOKEN',
      GET_TENANT_PARTNER_BY_SERVER_TOKEN,
      'query GetTenantPartnerByServerToken(',
    ],
    ['GET_TENANT_PARTNER_BY_ID', GET_TENANT_PARTNER_BY_ID, 'query GetTenantPartnerById('],
    [
      'DELETE_TENANT_PARTNER_BY_SERVER_TOKEN',
      DELETE_TENANT_PARTNER_BY_SERVER_TOKEN,
      'mutation DeleteTenantPartnerByServerToken(',
    ],
    [
      'GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT',
      GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT,
      'query GetTenantPartnerByCpoClientAndModuleId(',
    ],
    ['LIST_TENANT_PARTNERS_BY_CPO', LIST_TENANT_PARTNERS_BY_CPO, 'query TenantPartnersList('],
    ['GET_TENANT_BY_ID', GET_TENANT_BY_ID, 'query GetTenantById('],
    ['READ_AUTHORIZATION', READ_AUTHORIZATION, 'query ReadAuthorizations('],
    ['UPDATE_TOKEN_MUTATION', UPDATE_TOKEN_MUTATION, 'mutation UpdateAuthorization('],
    ['GET_AUTHORIZATION_BY_TOKEN', GET_AUTHORIZATION_BY_TOKEN, 'query GetAuthorizationByToken('],
    ['GET_AUTHORIZATION_BY_ID', GET_AUTHORIZATION_BY_ID, 'query GetAuthorizationById('],
    [
      'CREATE_AUTHORIZATION_MUTATION',
      CREATE_AUTHORIZATION_MUTATION,
      'mutation CreateAuthorization(',
    ],
    ['GET_GROUP_AUTHORIZATION', GET_GROUP_AUTHORIZATION, 'query GetGroupAuthorization('],
    ['GET_TRANSACTIONS_QUERY', GET_TRANSACTIONS_QUERY, 'query GetTransactions('],
    ['GET_TRANSACTION_BY_ID_QUERY', GET_TRANSACTION_BY_ID_QUERY, 'query GetTransactionById('],
    [
      'GET_ACTIVE_TRANSACTION_FOR_STOP_SESSION_QUERY',
      GET_ACTIVE_TRANSACTION_FOR_STOP_SESSION_QUERY,
      'query GetActiveTransactionForStopSession(',
    ],
  ])('%s declares %s', (_name, doc, header) => {
    expect(doc).toContain(header);
  });
});

describe('chargingStation queries', () => {
  it('BY_PK filters on the integer primary key', () => {
    expect(GET_CHARGING_STATION_BY_PK_QUERY).toContain('query GetChargingStationByPk($id: Int!)');
    expect(GET_CHARGING_STATION_BY_PK_QUERY).toContain(
      'ChargingStations(where: { id: { _eq: $id } })',
    );
  });

  it('BY_ID filters on ocppConnectionName, not the pk', () => {
    expect(GET_CHARGING_STATION_BY_ID_QUERY).toContain(
      'query GetChargingStationById($id: String!)',
    );
    expect(GET_CHARGING_STATION_BY_ID_QUERY).toContain(
      'ChargingStations(where: { ocppConnectionName: { _eq: $id } })',
    );
  });

  it.each([
    ['GET_CHARGING_STATION_BY_PK_QUERY', GET_CHARGING_STATION_BY_PK_QUERY],
    ['GET_CHARGING_STATION_BY_ID_QUERY', GET_CHARGING_STATION_BY_ID_QUERY],
  ])('%s selects the tenant party identity for OCPI attribution', (_name, doc) => {
    expect(doc).toContain('tenant: Tenant {');
    expect(doc).toMatch(/tenant: Tenant \{\s*partyId\s*countryCode/);
  });
});

describe('chargingStationSequence queries', () => {
  it('GET_SEQUENCE scopes to tenant, station and sequence type', () => {
    expect(GET_SEQUENCE).toContain(
      'where: { tenantId: { _eq: $tenantId }, stationId: { _eq: $stationId }, type: { _eq: $type } }',
    );
  });

  it('UPSERT_SEQUENCE upserts on the (stationId, type) unique constraint', () => {
    expect(UPSERT_SEQUENCE).toContain('constraint: ChargingStationSequences_stationId_type_key');
    expect(UPSERT_SEQUENCE).toContain('update_columns: value');
    // updatedAt is written from the same $createdAt variable on insert.
    expect(UPSERT_SEQUENCE).toContain('updatedAt: $createdAt');
  });
});

describe('location queries', () => {
  it('GET_LOCATIONS pages with a caller-built where and returns the total count', () => {
    expect(GET_LOCATIONS_QUERY).toContain('$where: Locations_bool_exp!');
    expect(GET_LOCATIONS_QUERY).toContain(
      'Locations(offset: $offset, limit: $limit, order_by: { createdAt: asc }, where: $where)',
    );
    expect(GET_LOCATIONS_QUERY).toContain('Locations_aggregate(where: $where)');
  });

  it.each([
    ['GET_LOCATION_BY_ID_QUERY', GET_LOCATION_BY_ID_QUERY],
    ['GET_EVSE_BY_ID_QUERY', GET_EVSE_BY_ID_QUERY],
    ['GET_CONNECTOR_BY_ID_QUERY', GET_CONNECTOR_BY_ID_QUERY],
  ])('%s scopes the location to the requesting party', (_name, doc) => {
    expect(doc).toContain(PARTY_SCOPE);
  });

  it('GET_LOCATION_BY_ID also filters on the location id', () => {
    expect(GET_LOCATION_BY_ID_QUERY).toContain('id: { _eq: $id }');
  });

  it('GET_EVSE_BY_ID narrows location, station and evse', () => {
    expect(GET_EVSE_BY_ID_QUERY).toContain('id: { _eq: $locationId }');
    expect(GET_EVSE_BY_ID_QUERY).toContain(
      'chargingPool: ChargingStations(where: { ocppConnectionName: { _eq: $stationId } })',
    );
    expect(GET_EVSE_BY_ID_QUERY).toContain('evses: Evses(where: { id: { _eq: $evseId } })');
  });

  it('GET_CONNECTOR_BY_ID narrows down to the single connector', () => {
    expect(GET_CONNECTOR_BY_ID_QUERY).toContain('id: { _eq: $locationId }');
    expect(GET_CONNECTOR_BY_ID_QUERY).toContain(
      'chargingPool: ChargingStations(where: { ocppConnectionName: { _eq: $stationId } })',
    );
    expect(GET_CONNECTOR_BY_ID_QUERY).toContain('evses: Evses(where: { id: { _eq: $evseId } })');
    expect(GET_CONNECTOR_BY_ID_QUERY).toContain(
      'connectors: Connectors(where: { connectorId: { _eq: $connectorId } })',
    );
  });
});

describe('tariff queries', () => {
  it('GET_TARIFF_BY_KEY scopes by id and requesting party', () => {
    expect(GET_TARIFF_BY_KEY_QUERY).toContain('id: { _eq: $id }');
    expect(GET_TARIFF_BY_KEY_QUERY).toContain(PARTY_SCOPE);
  });

  it('GET_TARIFFS pages with a caller-built where and returns the total count', () => {
    expect(GET_TARIFFS_QUERY).toContain('$where: Tariffs_bool_exp!');
    expect(GET_TARIFFS_QUERY).toContain(
      'Tariffs(limit: $limit, offset: $offset, order_by: { createdAt: asc }, where: $where)',
    );
    expect(GET_TARIFFS_QUERY).toContain('Tariffs_aggregate(where: $where)');
  });
});

describe('tenant mutations', () => {
  it('UPDATE_TENANT_PARTNER_PROFILE targets one partner and only its OCPI profile column', () => {
    expect(UPDATE_TENANT_PARTNER_PROFILE).toContain('where: { id: { _eq: $partnerId } }');
    expect(UPDATE_TENANT_PARTNER_PROFILE).toContain('_set: { partnerProfileOCPI: $input }');
    expect(UPDATE_TENANT_PARTNER_PROFILE).toContain('affected_rows');
  });

  it('DELETE_TENANT_PARTNER_BY_ID deletes by primary key filter', () => {
    expect(DELETE_TENANT_PARTNER_BY_ID).toContain(
      'delete_TenantPartners(where: { id: { _eq: $id } })',
    );
    expect(DELETE_TENANT_PARTNER_BY_ID).toContain('affected_rows');
  });
});

describe('tenantPartner queries', () => {
  const TOKEN_CONTAINS =
    'where: { partnerProfileOCPI: { _contains: { serverCredentials: { token: $serverToken } } } }';

  it('GET_TENANT_PARTNER_BY_SERVER_TOKEN matches the token inside the jsonb profile', () => {
    expect(GET_TENANT_PARTNER_BY_SERVER_TOKEN).toContain(TOKEN_CONTAINS);
    expect(GET_TENANT_PARTNER_BY_SERVER_TOKEN).toContain('partnerProfileOCPI');
    expect(GET_TENANT_PARTNER_BY_SERVER_TOKEN).toContain('serverProfileOCPI');
  });

  it('DELETE_TENANT_PARTNER_BY_SERVER_TOKEN uses the same jsonb token predicate', () => {
    expect(DELETE_TENANT_PARTNER_BY_SERVER_TOKEN).toContain('delete_TenantPartners(');
    expect(DELETE_TENANT_PARTNER_BY_SERVER_TOKEN).toContain(TOKEN_CONTAINS);
    expect(DELETE_TENANT_PARTNER_BY_SERVER_TOKEN).toContain('affected_rows');
  });

  it('GET_TENANT_PARTNER_BY_ID looks up by primary key', () => {
    expect(GET_TENANT_PARTNER_BY_ID).toContain('TenantPartners_by_pk(id: $id)');
  });

  it('GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT scopes to CPO tenant and client party', () => {
    expect(GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT).toContain(
      'Tenant: { countryCode: { _eq: $cpoCountryCode }, partyId: { _eq: $cpoPartyId } }',
    );
    expect(GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT).toContain(
      'countryCode: { _eq: $clientCountryCode }',
    );
    expect(GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT).toContain('partyId: { _eq: $clientPartyId }');
  });

  it('GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT keeps the client party variables nullable', () => {
    // CPO scope is mandatory; the client side may be omitted to list all partners.
    expect(GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT).toContain('$cpoCountryCode: String!');
    expect(GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT).toContain('$cpoPartyId: String!');
    expect(GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT).not.toContain('$clientCountryCode: String!');
    expect(GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT).not.toContain('$clientPartyId: String!');
  });

  it('LIST_TENANT_PARTNERS_BY_CPO filters partners advertising the module endpoint', () => {
    expect(LIST_TENANT_PARTNERS_BY_CPO).toContain(
      'Tenant: { countryCode: { _eq: $cpoCountryCode }, partyId: { _eq: $cpoPartyId } }',
    );
    expect(LIST_TENANT_PARTNERS_BY_CPO).toContain(
      'partnerProfileOCPI: { _contains: { endpoints: [{ identifier: $endpointIdentifier }] } }',
    );
  });
});

describe('tenantVersionEndpoints queries', () => {
  it('GET_TENANT_BY_ID selects the server OCPI profile for one tenant', () => {
    expect(GET_TENANT_BY_ID).toContain('Tenants(where: { id: { _eq: $id } })');
    expect(GET_TENANT_BY_ID).toContain('serverProfileOCPI');
    expect(GET_TENANT_BY_ID).toContain('countryCode');
    expect(GET_TENANT_BY_ID).toContain('partyId');
  });
});

describe('token queries', () => {
  it('READ_AUTHORIZATION filters token identity and owning partner party', () => {
    expect(READ_AUTHORIZATION).toContain('idToken: { _eq: $idToken }');
    expect(READ_AUTHORIZATION).toContain('idTokenType: { _eq: $type }');
    expect(READ_AUTHORIZATION).toContain(
      'TenantPartner: { countryCode: { _eq: $countryCode }, partyId: { _eq: $partyId } }',
    );
  });

  it('UPDATE_TOKEN_MUTATION scopes the update to one partner token and applies $set', () => {
    expect(UPDATE_TOKEN_MUTATION).toContain('update_Authorizations(');
    expect(UPDATE_TOKEN_MUTATION).toContain('idToken: { _eq: $idToken }');
    expect(UPDATE_TOKEN_MUTATION).toContain('idTokenType: { _eq: $type }');
    expect(UPDATE_TOKEN_MUTATION).toContain('tenantPartnerId: { _eq: $tenantPartnerId }');
    expect(UPDATE_TOKEN_MUTATION).toContain('_set: $set');
    expect(UPDATE_TOKEN_MUTATION).toContain('returning');
  });

  it('GET_AUTHORIZATION_BY_TOKEN requires token, type and partner', () => {
    expect(GET_AUTHORIZATION_BY_TOKEN).toContain(
      'query GetAuthorizationByToken($idToken: citext!, $idTokenType: String!, $tenantPartnerId: Int!)',
    );
    expect(GET_AUTHORIZATION_BY_TOKEN).toContain('idToken: { _eq: $idToken }');
    expect(GET_AUTHORIZATION_BY_TOKEN).toContain('idTokenType: { _eq: $idTokenType }');
    expect(GET_AUTHORIZATION_BY_TOKEN).toContain('tenantPartnerId: { _eq: $tenantPartnerId }');
  });

  it('GET_AUTHORIZATION_BY_ID looks up by primary key', () => {
    expect(GET_AUTHORIZATION_BY_ID).toContain('Authorizations_by_pk(id: $id)');
  });

  it('CREATE_AUTHORIZATION_MUTATION inserts one row bound to tenant and partner', () => {
    expect(CREATE_AUTHORIZATION_MUTATION).toContain('insert_Authorizations_one(');
    expect(CREATE_AUTHORIZATION_MUTATION).toContain('tenantId: $tenantId');
    expect(CREATE_AUTHORIZATION_MUTATION).toContain('tenantPartnerId: $tenantPartnerId');
    expect(CREATE_AUTHORIZATION_MUTATION).toContain('idToken: $idToken');
    expect(CREATE_AUTHORIZATION_MUTATION).toContain('idTokenType: $idTokenType');
  });

  it('GET_GROUP_AUTHORIZATION pins idTokenType to the Central literal', () => {
    expect(GET_GROUP_AUTHORIZATION).toContain('idToken: { _eq: $groupId }');
    expect(GET_GROUP_AUTHORIZATION).toContain('idTokenType: { _eq: "Central" }');
    expect(GET_GROUP_AUTHORIZATION).toContain('tenantPartnerId: { _eq: $tenantPartnerId }');
  });
});

describe('transaction queries', () => {
  it('GET_TRANSACTIONS pages with a caller-built where and returns the total count', () => {
    expect(GET_TRANSACTIONS_QUERY).toContain('$where: Transactions_bool_exp!');
    expect(GET_TRANSACTIONS_QUERY).toContain(
      'Transactions(offset: $offset, limit: $limit, order_by: { createdAt: asc }, where: $where)',
    );
    expect(GET_TRANSACTIONS_QUERY).toContain('Transactions_aggregate(where: $where)');
  });

  it('GET_TRANSACTION_BY_ID looks up by primary key', () => {
    expect(GET_TRANSACTION_BY_ID_QUERY).toContain('Transactions_by_pk(id: $id)');
  });

  it('STOP_SESSION lookup only matches active sessions of the calling party', () => {
    expect(GET_ACTIVE_TRANSACTION_FOR_STOP_SESSION_QUERY).toContain(
      'transactionId: { _eq: $transactionId }',
    );
    expect(GET_ACTIVE_TRANSACTION_FOR_STOP_SESSION_QUERY).toContain('isActive: { _eq: true }');
    expect(GET_ACTIVE_TRANSACTION_FOR_STOP_SESSION_QUERY).toContain(
      'TenantPartner: { countryCode: { _eq: $countryCode }, partyId: { _eq: $partyId } }',
    );
    expect(GET_ACTIVE_TRANSACTION_FOR_STOP_SESSION_QUERY).toContain(
      'order_by: { createdAt: desc }',
    );
  });
});

describe('OcpiGraphqlClient', () => {
  const ENDPOINT = 'https://hasura.example.com/v1/graphql';
  const FIXTURE_VALUE = 'test-value';
  const HEADERS = { 'x-hasura-admin-secret': FIXTURE_VALUE };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hands endpoint and headers to GraphQLClient', () => {
    new OcpiGraphqlClient(ENDPOINT, HEADERS);

    expect(GraphQLClient).toHaveBeenCalledTimes(1);
    expect(GraphQLClient).toHaveBeenCalledWith(ENDPOINT, { headers: HEADERS });
  });

  it('request delegates document and variables and returns the raw result', async () => {
    const client = new OcpiGraphqlClient(ENDPOINT, HEADERS);
    const data = { Tenants: [{ id: 7, serverProfileOCPI: null }] };
    requestMock.mockResolvedValueOnce(data);

    const result = await client.request(GET_TENANT_BY_ID, { id: 7 });

    expect(result).toBe(data);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith(GET_TENANT_BY_ID, { id: 7 });
  });

  it('request without variables forwards undefined', async () => {
    const client = new OcpiGraphqlClient(ENDPOINT);
    requestMock.mockResolvedValueOnce({ Locations: [] });

    await client.request(GET_LOCATIONS_QUERY);

    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith(GET_LOCATIONS_QUERY, undefined);
  });

  it('request surfaces GraphQLClient rejections unchanged', async () => {
    const client = new OcpiGraphqlClient(ENDPOINT, HEADERS);
    requestMock.mockRejectedValueOnce(
      new Error('invalid x-hasura-admin-secret/x-hasura-access-key'),
    );

    await expect(client.request(GET_TENANT_BY_ID, { id: 7 })).rejects.toThrow(
      'invalid x-hasura-admin-secret/x-hasura-access-key',
    );
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});
