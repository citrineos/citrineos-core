// ============================================================================
// FILE: apps/mock-msp/src/config.ts   (FROZEN)
// ============================================================================
import type { MockConfig } from './core/types.js';
export function loadConfig(env: NodeJS.ProcessEnv = process.env): MockConfig {
  const publicBaseUrl = env.MOCK_MSP_PUBLIC_BASE_URL ?? 'http://host.docker.internal:8083/ocpi';
  return {
    port: Number(env.MOCK_MSP_PORT ?? 8083),
    host: env.MOCK_MSP_HOST ?? '0.0.0.0',
    publicBaseUrl,
    citrineOcpiBaseUrl: env.CITRINE_OCPI_BASE_URL ?? 'http://localhost:8085/ocpi',
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
  };
}
