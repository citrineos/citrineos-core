// ============================================================================
// FILE: apps/mock-msp/src/identity.ts   (FROZEN)
// ============================================================================
import { ModuleId, InterfaceRole, VersionNumber } from './ocpi/barrel.js';
import type { MockConfig, OcpiIdentity, CpoEndpoint } from './core/types.js';
export function buildIdentity(cfg: MockConfig): OcpiIdentity {
  return {
    country_code: cfg.countryCode,
    party_id: cfg.partyId,
    role: 'EMSP',
    version: '2.2.1',
    business_details: {
      name: 'TestMobilitySolutions',
      website: 'https://www.test-mobility.com',
      logo: {
        url: 'https://www.test-mobility.com/assets/brand/logo.svg',
        type: 'svg',
        category: 'OPERATOR',
        width: 150,
        height: 60,
      },
    },
  };
}
// The 8 endpoints Citrine discovers at GET /versions/2.2.1. SPLIT {identifier, role}
// form (never the DB's locations_RECEIVER combined form). base = cfg.publicBaseUrl.
export function buildEndpointCatalog(base: string): CpoEndpoint[] {
  const v = `${base}/2.2.1`;
  const e = `${v}/emsp`;
  return [
    { identifier: ModuleId.Credentials, role: InterfaceRole.SENDER, url: `${v}/credentials` },
    { identifier: ModuleId.Locations, role: InterfaceRole.RECEIVER, url: `${e}/locations` },
    { identifier: ModuleId.Tariffs, role: InterfaceRole.RECEIVER, url: `${e}/tariffs` },
    { identifier: ModuleId.Sessions, role: InterfaceRole.RECEIVER, url: `${e}/sessions` },
    { identifier: ModuleId.Cdrs, role: InterfaceRole.RECEIVER, url: `${e}/cdrs` },
    {
      identifier: ModuleId.ChargingProfiles,
      role: InterfaceRole.RECEIVER,
      url: `${e}/chargingprofiles`,
    },
    { identifier: ModuleId.Tokens, role: InterfaceRole.SENDER, url: `${e}/tokens` },
    { identifier: ModuleId.Commands, role: InterfaceRole.SENDER, url: `${e}/commands` },
  ];
}
export const VERSION = VersionNumber.TWO_DOT_TWO_DOT_ONE;
export function versionsListUrl(base: string): string {
  return `${base}/versions`;
}
export function versionDetailsUrl(base: string): string {
  return `${base}/versions/2.2.1`;
}
