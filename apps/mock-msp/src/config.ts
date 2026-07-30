// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/config.ts   (FROZEN)
// ============================================================================
import type { MockConfig } from './core/types.js';
export function loadConfig(env: NodeJS.ProcessEnv = process.env): MockConfig {
  const publicBaseUrl = env.MOCK_MSP_PUBLIC_BASE_URL ?? 'http://host.docker.internal:8083/ocpi';
  const citrineOcpiBaseUrl = env.CITRINE_OCPI_BASE_URL ?? 'http://localhost:8085/ocpi';
  // Citrine's version list lives under /versions/{tenantId}; the seeded tenant is 1.
  const citrineTenantId = env.CITRINE_TENANT_ID ?? '1';
  return {
    port: Number(env.MOCK_MSP_PORT ?? 8083),
    host: env.MOCK_MSP_HOST ?? '0.0.0.0',
    publicBaseUrl,
    citrineOcpiBaseUrl,
    citrineVersionsUrl:
      env.CITRINE_VERSIONS_URL ?? `${citrineOcpiBaseUrl}/versions/${citrineTenantId}`,
    citrineHasuraUrl: env.CITRINE_HASURA_URL ?? 'http://localhost:8090/v1/graphql',
    countryCode: env.MOCK_MSP_COUNTRY_CODE ?? 'US',
    partyId: env.MOCK_MSP_PARTY_ID ?? 'TST',
    cpoCountryCode: env.MOCK_MSP_CPO_COUNTRY_CODE ?? 'US',
    cpoPartyId: env.MOCK_MSP_CPO_PARTY_ID ?? 'S44',
    bootstrapTokenWeAccept:
      env.MOCK_MSP_CLIENT_TOKEN ?? 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
    bootstrapTokenWePresent:
      env.MOCK_MSP_SERVER_TOKEN ?? 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9eyJzdWIiOiJwYXJ0bmVyIn0',
    scenarioPath: env.MOCK_MSP_SCENARIO,
    autoRegister: env.MOCK_MSP_AUTO_REGISTER === '1',
    logLevel: env.MOCK_MSP_LOG_LEVEL ?? 'info',
    controlSecret: env.MOCK_MSP_CONTROL_SECRET,
    // Defaults for the live-charging flow: they point START_SESSION at the seeded
    // station EVerest connects as (cp001 / evse cp001::1 / connector 1 / token
    // DEADBEEF). Override per deployment if the seed changes.
    defaultLocationId: env.MOCK_MSP_DEFAULT_LOCATION_ID ?? '1',
    defaultEvseUid: env.MOCK_MSP_DEFAULT_EVSE_UID ?? 'cp001::1',
    defaultConnectorId: env.MOCK_MSP_DEFAULT_CONNECTOR_ID ?? '1',
    defaultTokenUid: env.MOCK_MSP_DEFAULT_TOKEN_UID ?? 'DEADBEEF',
    defaultTokenType: env.MOCK_MSP_DEFAULT_TOKEN_TYPE ?? 'RFID',
  };
}
