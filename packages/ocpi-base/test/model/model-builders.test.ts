// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { validateSync } from 'class-validator';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z, ZodError } from 'zod';
import {
  buildOcpiResponse,
  OcpiResponseSchema,
  OcpiResponseStatusCode,
} from '../../src/model/ocpi-response.js';
import {
  buildOcpiPaginatedResponse,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
  PaginatedResponseSchema,
} from '../../src/model/paginated-response.js';
import { OcpiHeaders } from '../../src/model/ocpi-headers.js';
import { LocationDTOSchema } from '../../src/model/dto/location-dto.js';
import { EvseDTOSchema } from '../../src/model/dto/evse-dto.js';
import { TokenDTOSchema } from '../../src/model/dto/token-dto.js';
import { ConnectorDTOSchema } from '../../src/model/dto/connector-dto.js';
import { ImageDTOSchema } from '../../src/model/dto/image-dto.js';
import { AdminCredentialsRequestDTOSchema } from '../../src/model/dto/admin-credentials-request-dto.js';
import { CredentialsRoleDTOSchema } from '../../src/model/dto/credentials-role-dto.js';
import { OcpiLocationDTOSchema } from '../../src/model/dto/ocpi-location-dto.js';
import { EvseStatus } from '../../src/model/evse-status.js';
import { TokenType } from '../../src/model/token-type.js';
import { WhitelistType } from '../../src/model/whitelist-type.js';
import { ConnectorType } from '../../src/model/connector-type.js';
import { ConnectorFormat } from '../../src/model/connector-format.js';
import { PowerType } from '../../src/model/power-type.js';
import { Role } from '../../src/model/role.js';
import { ImageCategory } from '../../src/model/image-category.js';
import { ImageType } from '../../src/model/image-type.js';
import { CountryCode } from '../../src/util/util.js';

const FROZEN_NOW = new Date('2026-01-15T12:00:00.000Z');
const LAST_UPDATED = '2026-08-12T10:00:00.000Z';

function aConnector() {
  return {
    id: '1',
    standard: ConnectorType.CHADEMO,
    format: ConnectorFormat.CABLE,
    power_type: PowerType.DC,
    max_voltage: 400,
    max_amperage: 32,
    last_updated: LAST_UPDATED,
  };
}

function anEvse() {
  return {
    uid: 'CS001::1',
    status: EvseStatus.AVAILABLE,
    connectors: [aConnector()],
    last_updated: LAST_UPDATED,
  };
}

function aLocation() {
  return {
    country_code: 'US',
    party_id: 'CPO',
    id: 'LOC1',
    publish: true,
    address: '1 Main St',
    city: 'Phoenix',
    country: 'USA',
    coordinates: { latitude: '33.44840', longitude: '-112.07400' },
    time_zone: 'America/Phoenix',
    last_updated: LAST_UPDATED,
  };
}

function aToken() {
  return {
    country_code: 'US',
    party_id: 'MSP',
    uid: 'TOKEN001',
    type: TokenType.RFID,
    contract_id: 'USMSPC00000001',
    issuer: 'TestMobility',
    valid: true,
    whitelist: WhitelistType.ALWAYS,
    last_updated: LAST_UPDATED,
  };
}

function aCredentialsRole() {
  return {
    role: Role.EMSP,
    party_id: 'MSP',
    country_code: 'US',
    business_details: { name: 'Test MSP' },
  };
}

describe('buildOcpiResponse', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds the full envelope with data and message', () => {
    const response = buildOcpiResponse(
      OcpiResponseStatusCode.GenericSuccessCode,
      { foo: 'bar' },
      'Success',
    );
    expect(response).toEqual({
      status_code: 1000,
      status_message: 'Success',
      data: { foo: 'bar' },
      timestamp: FROZEN_NOW,
    });
  });

  it('leaves data and message undefined when omitted', () => {
    const response = buildOcpiResponse(OcpiResponseStatusCode.ClientUnknownToken);
    expect(response.status_code).toBe(2004);
    expect(response.data).toBeUndefined();
    expect(response.status_message).toBeUndefined();
    expect(response.timestamp.getTime()).toBe(FROZEN_NOW.getTime());
  });

  it('round-trips through OcpiResponseSchema', () => {
    const response = buildOcpiResponse(OcpiResponseStatusCode.GenericSuccessCode, 'payload');
    const parsed = OcpiResponseSchema(z.string()).safeParse(response);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.data).toBe('payload');
    expect(parsed.data?.status_code).toBe(OcpiResponseStatusCode.GenericSuccessCode);
  });

  it('schema coerces a string timestamp into a Date', () => {
    const parsed = OcpiResponseSchema(z.string()).safeParse({
      status_code: 1000,
      timestamp: '2026-08-12T10:00:00.000Z',
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.timestamp).toBeInstanceOf(Date);
    expect(parsed.data?.timestamp.toISOString()).toBe('2026-08-12T10:00:00.000Z');
  });

  it('schema rejects a status_code outside the OCPI enum', () => {
    const parsed = OcpiResponseSchema(z.string()).safeParse({
      status_code: 9999,
      timestamp: '2026-08-12T10:00:00.000Z',
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['status_code']);
    expect(parsed.error?.issues[0].code).toBe('invalid_value');
  });
});

describe('buildOcpiPaginatedResponse', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // link is hardcoded to '' in the builder (see paginated-response.ts:39); the
  // OCPI Link header semantics are not modeled here, so link is not asserted.
  it('carries total/limit/offset and the data page', () => {
    const response = buildOcpiPaginatedResponse(
      OcpiResponseStatusCode.GenericSuccessCode,
      42,
      10,
      20,
      [aToken()],
      'ok',
    );
    expect(response.status_code).toBe(1000);
    expect(response.status_message).toBe('ok');
    expect(response.total).toBe(42);
    expect(response.limit).toBe(10);
    expect(response.offset).toBe(20);
    expect(response.data).toHaveLength(1);
    expect((response.data as any[])[0].uid).toBe('TOKEN001');
    expect(response.timestamp).toEqual(FROZEN_NOW);
  });

  it('round-trips through PaginatedResponseSchema(TokenDTOSchema)', () => {
    const response = buildOcpiPaginatedResponse(
      OcpiResponseStatusCode.GenericSuccessCode,
      1,
      10,
      0,
      [aToken()],
    );
    const parsed = PaginatedResponseSchema(TokenDTOSchema).safeParse(response);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.total).toBe(1);
    expect(parsed.data?.data?.[0].uid).toBe('TOKEN001');
    expect(parsed.data?.data?.[0].last_updated).toEqual(new Date(LAST_UPDATED));
  });

  it('schema fills offset/limit defaults when absent', () => {
    const parsed = PaginatedResponseSchema(z.string()).safeParse({
      status_code: 1000,
      timestamp: LAST_UPDATED,
      total: 0,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.offset).toBe(DEFAULT_OFFSET);
    expect(parsed.data?.limit).toBe(DEFAULT_LIMIT);
    expect(parsed.data?.offset).toBe(0);
    expect(parsed.data?.limit).toBe(10);
  });

  it('schema rejects limit above 200', () => {
    const parsed = PaginatedResponseSchema(z.string()).safeParse({
      status_code: 1000,
      timestamp: LAST_UPDATED,
      total: 0,
      limit: 201,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['limit']);
    expect(parsed.error?.issues[0].code).toBe('too_big');
  });

  it('schema rejects a negative total', () => {
    const parsed = PaginatedResponseSchema(z.string()).safeParse({
      status_code: 1000,
      timestamp: LAST_UPDATED,
      total: -1,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['total']);
    expect(parsed.error?.issues[0].code).toBe('too_small');
  });
});

describe('OcpiHeaders', () => {
  it('constructor maps the four routing headers positionally', () => {
    const headers = new OcpiHeaders('US', 'MSP', 'CA', 'CPO');
    expect(headers.fromCountryCode).toBe('US');
    expect(headers.fromPartyId).toBe('MSP');
    expect(headers.toCountryCode).toBe('CA');
    expect(headers.toPartyId).toBe('CPO');
  });

  it('passes class-validator with well-formed values', () => {
    const errors = validateSync(new OcpiHeaders('US', 'MSP', 'CA', 'CPO'));
    expect(errors).toHaveLength(0);
  });

  it('flags short country code and empty party id', () => {
    const errors = validateSync(new OcpiHeaders('U', '', 'CA', 'CPO'));
    const byProperty = Object.fromEntries(
      errors.map((e) => [e.property, Object.keys(e.constraints ?? {}).sort()]),
    );
    expect(Object.keys(byProperty).sort()).toEqual(['fromCountryCode', 'fromPartyId']);
    expect(byProperty.fromCountryCode).toContain('isLength');
    expect(byProperty.fromPartyId).toContain('isNotEmpty');
  });
});

describe('ConnectorDTOSchema', () => {
  it('accepts a full connector and coerces last_updated', () => {
    const parsed = ConnectorDTOSchema.safeParse(aConnector());
    expect(parsed.success).toBe(true);
    expect(parsed.data?.last_updated).toBeInstanceOf(Date);
    expect(parsed.data?.last_updated.toISOString()).toBe(LAST_UPDATED);
    expect(parsed.data?.max_voltage).toBe(400);
  });

  it('throws on an unknown connector standard', () => {
    expect(() => ConnectorDTOSchema.parse({ ...aConnector(), standard: 'TESLA_PLUG' })).toThrow(
      ZodError,
    );
    expect(() => ConnectorDTOSchema.parse({ ...aConnector(), standard: 'TESLA_PLUG' })).toThrow(
      /invalid_value/,
    );
  });

  it('rejects a fractional max_amperage', () => {
    const parsed = ConnectorDTOSchema.safeParse({ ...aConnector(), max_amperage: 31.5 });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['max_amperage']);
  });
});

describe('EvseDTOSchema', () => {
  it('accepts an evse with one connector', () => {
    const parsed = EvseDTOSchema.safeParse(anEvse());
    expect(parsed.success).toBe(true);
    expect(parsed.data?.status).toBe(EvseStatus.AVAILABLE);
    expect(parsed.data?.connectors).toHaveLength(1);
    expect(parsed.data?.connectors[0].id).toBe('1');
  });

  it('rejects an empty connectors array', () => {
    const parsed = EvseDTOSchema.safeParse({ ...anEvse(), connectors: [] });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['connectors']);
    expect(parsed.error?.issues[0].code).toBe('too_small');
  });

  it('surfaces a nested connector issue with the full path', () => {
    const parsed = EvseDTOSchema.safeParse({
      ...anEvse(),
      connectors: [{ ...aConnector(), power_type: 'AC_4_PHASE' }],
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['connectors', 0, 'power_type']);
  });
});

describe('TokenDTOSchema', () => {
  it('accepts a full token', () => {
    const parsed = TokenDTOSchema.safeParse(aToken());
    expect(parsed.success).toBe(true);
    expect(parsed.data?.type).toBe(TokenType.RFID);
    expect(parsed.data?.whitelist).toBe(WhitelistType.ALWAYS);
    expect(parsed.data?.last_updated).toEqual(new Date(LAST_UPDATED));
  });

  it('rejects a three-letter country_code', () => {
    const parsed = TokenDTOSchema.safeParse({ ...aToken(), country_code: 'USA' });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['country_code']);
    expect(parsed.error?.issues[0].code).toBe('too_big');
  });

  it('rejects an unparseable last_updated', () => {
    const parsed = TokenDTOSchema.safeParse({ ...aToken(), last_updated: 'not-a-date' });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['last_updated']);
  });
});

describe('LocationDTOSchema', () => {
  it('accepts a minimal publishable location', () => {
    const parsed = LocationDTOSchema.safeParse(aLocation());
    expect(parsed.success).toBe(true);
    expect(parsed.data?.publish).toBe(true);
    expect(parsed.data?.coordinates.latitude).toBe('33.44840');
    expect(parsed.data?.last_updated).toEqual(new Date(LAST_UPDATED));
  });

  it('rejects a latitude that fails the coordinate regex', () => {
    const parsed = LocationDTOSchema.safeParse({
      ...aLocation(),
      coordinates: { latitude: 'north', longitude: '-112.07400' },
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['coordinates', 'latitude']);
    expect(parsed.error?.issues[0].code).toBe('invalid_format');
  });

  it('rejects a missing country', () => {
    const { country: _country, ...withoutCountry } = aLocation();
    const parsed = LocationDTOSchema.safeParse(withoutCountry);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['country']);
    expect(parsed.error?.issues[0].code).toBe('invalid_type');
  });
});

describe('ImageDTOSchema', () => {
  it('accepts a full image', () => {
    const parsed = ImageDTOSchema.safeParse({
      url: 'https://example.com/img.png',
      category: ImageCategory.CHARGER,
      type: ImageType.png,
      width: 1024,
      height: 768,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.url).toBe('https://example.com/img.png');
    expect(parsed.data?.width).toBe(1024);
  });

  it('rejects a non-url url', () => {
    const parsed = ImageDTOSchema.safeParse({
      url: 'not a url',
      category: ImageCategory.CHARGER,
      type: ImageType.png,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['url']);
    expect(parsed.error?.issues[0].code).toBe('invalid_format');
  });

  it('rejects width above 99999', () => {
    const parsed = ImageDTOSchema.safeParse({
      url: 'https://example.com/img.png',
      category: ImageCategory.CHARGER,
      type: ImageType.png,
      width: 100000,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['width']);
    expect(parsed.error?.issues[0].code).toBe('too_big');
  });
});

describe('CredentialsRoleDTOSchema', () => {
  it('accepts an eMSP role', () => {
    const parsed = CredentialsRoleDTOSchema.safeParse(aCredentialsRole());
    expect(parsed.success).toBe(true);
    expect(parsed.data?.role).toBe(Role.EMSP);
    expect(parsed.data?.business_details.name).toBe('Test MSP');
  });

  it('rejects a business_details without a name', () => {
    const parsed = CredentialsRoleDTOSchema.safeParse({
      ...aCredentialsRole(),
      business_details: {},
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['business_details', 'name']);
    expect(parsed.error?.issues[0].code).toBe('invalid_type');
  });

  it('rejects a party_id that is not exactly three characters', () => {
    const parsed = CredentialsRoleDTOSchema.safeParse({ ...aCredentialsRole(), party_id: 'MS' });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['party_id']);
    expect(parsed.error?.issues[0].code).toBe('too_small');
  });
});

describe('AdminCredentialsRequestDTOSchema', () => {
  function aRequest() {
    return {
      url: 'https://example.com/ocpi/versions',
      role: aCredentialsRole(),
      mspCountryCode: CountryCode.US,
      mspPartyId: 'MSP',
    };
  }

  it('accepts a full admin credentials request', () => {
    const parsed = AdminCredentialsRequestDTOSchema.safeParse(aRequest());
    expect(parsed.success).toBe(true);
    expect(parsed.data?.mspCountryCode).toBe('US');
    expect(parsed.data?.role.role).toBe(Role.EMSP);
  });

  it('rejects a country code outside the CountryCode enum', () => {
    const parsed = AdminCredentialsRequestDTOSchema.safeParse({
      ...aRequest(),
      mspCountryCode: 'DE',
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['mspCountryCode']);
    expect(parsed.error?.issues[0].code).toBe('invalid_value');
  });

  it('surfaces a nested role issue with the full path', () => {
    const parsed = AdminCredentialsRequestDTOSchema.safeParse({
      ...aRequest(),
      role: { ...aCredentialsRole(), country_code: 'U' },
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['role', 'country_code']);
  });
});

describe('OcpiLocationDTOSchema', () => {
  it('accepts and coerces lastUpdated from a string', () => {
    const parsed = OcpiLocationDTOSchema.safeParse({
      evseId: 1,
      stationId: 'CS001',
      lastUpdated: LAST_UPDATED,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.evseId).toBe(1);
    expect(parsed.data?.stationId).toBe('CS001');
    expect(parsed.data?.lastUpdated).toEqual(new Date(LAST_UPDATED));
  });

  it('rejects a fractional evseId', () => {
    const parsed = OcpiLocationDTOSchema.safeParse({
      evseId: 1.5,
      stationId: 'CS001',
      lastUpdated: LAST_UPDATED,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toHaveLength(1);
    expect(parsed.error?.issues[0].path).toEqual(['evseId']);
    expect(parsed.error?.issues[0].code).toBe('invalid_type');
  });
});
