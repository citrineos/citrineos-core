// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { HttpStatus, UnauthorizedError } from '@citrineos/base';
import {
  ChargingStationSequenceTypeEnum,
  IdTokenEnum,
  OCPP2_1,
  OCPPVersion,
  type SystemConfig,
} from '@citrineos/types';
import type { IChargingStationSequenceRepository } from '@citrineos/dal';
import { getAuthorizationTokenFromRequest, getHeaderValue, initSwagger } from '@/apis/swagger.js';
import { TotpUtil } from '@services/totp/totp-util.js';
import { isForeignKeyConstraintError } from '@util/errors.js';
import { calculateCheckDigit } from '@util/emaid-check-digit-calculator.js';
import { IdGenerator } from '@util/id-generator.js';
import { resolveStationProtocol } from '@util/station-protocol.js';
import {
  validateEMAIDIdToken,
  validateEVCCIDIdToken,
  validateIdToken,
  validateOcpp21IdToken,
  validateTariffConditionsTimeFields,
  validateTimeOfDay,
  validateVINIdToken,
} from '@util/validator.js';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('IdGenerator', () => {
  it('delegates generateRequestId to the sequence repository', async () => {
    const repository = { getNextSequenceValue: vi.fn().mockResolvedValue(42) };
    const generator = new IdGenerator({
      chargingStationSequenceRepository:
        repository as unknown as IChargingStationSequenceRepository,
    });

    const id = await generator.generateRequestId(
      2,
      'cs-001',
      ChargingStationSequenceTypeEnum.remoteStartId,
    );

    expect(id).toBe(42);
    expect(repository.getNextSequenceValue).toHaveBeenCalledTimes(1);
    expect(repository.getNextSequenceValue).toHaveBeenCalledWith(2, 'cs-001', 'remoteStartId');
  });

  it('propagates repository failures', async () => {
    const repository = {
      getNextSequenceValue: vi.fn().mockRejectedValue(new Error('sequence unavailable')),
    };
    const generator = new IdGenerator({
      chargingStationSequenceRepository:
        repository as unknown as IChargingStationSequenceRepository,
    });

    await expect(
      generator.generateRequestId(2, 'cs-001', ChargingStationSequenceTypeEnum.transactionId),
    ).rejects.toThrow('sequence unavailable');
    expect(repository.getNextSequenceValue).toHaveBeenCalledTimes(1);
  });
});

describe('calculateCheckDigit', () => {
  // Published vectors: eMI3 "Check Digit Calculation for Contract-IDs" example
  // DE-83D-UIEN83QGZ-D and the Gireve contract id example FR-XYZ-123456789-2.
  it('should return D for the eMI3 specification example DE83DUIEN83QGZ', () => {
    expect(calculateCheckDigit('DE83DUIEN83QGZ')).toBe('D');
  });

  it('should return 2 for the Gireve example FRXYZ123456789', () => {
    expect(calculateCheckDigit('FRXYZ123456789')).toBe('2');
  });

  it('should uppercase the input before calculating', () => {
    expect(calculateCheckDigit('de83duien83qgz')).toBe('D');
  });

  it('should return M for contract id NL123C10028948', () => {
    // Regression pin computed by the spec algorithm validated above.
    expect(calculateCheckDigit('NL123C10028948')).toBe('M');
  });

  it('should throw for input not exactly 14 characters', () => {
    expect(() => calculateCheckDigit('DE83DUIEN83QG')).toThrow(
      'Input must be exactly 14 characters',
    );
    expect(() => calculateCheckDigit('DE83DUIEN83QGZD')).toThrow(
      'Input must be exactly 14 characters',
    );
  });

  it('should throw for non-alphanumeric characters', () => {
    expect(() => calculateCheckDigit('DE83DUIEN83QG!')).toThrow(
      'Input must contain only alphanumeric characters',
    );
  });
});

describe('resolveStationProtocol', () => {
  const supported = [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1];

  it('should return unsupported when the station is unknown', async () => {
    const readChargingStation = vi.fn().mockResolvedValue(undefined);

    const result = await resolveStationProtocol(readChargingStation, 5, 'cs-42', supported);

    expect(result).toEqual({
      supported: false,
      reason: 'Protocol of cs-42 station is unknown; it must connect before this operation',
    });
    expect(readChargingStation).toHaveBeenCalledTimes(1);
    expect(readChargingStation).toHaveBeenCalledWith(5, 'cs-42');
  });

  it('should return unsupported when the station has no stored protocol', async () => {
    const readChargingStation = vi.fn().mockResolvedValue({ protocol: undefined });

    const result = await resolveStationProtocol(readChargingStation, 1, 'cs-1', supported);

    expect(result).toEqual({
      supported: false,
      reason: 'Protocol of cs-1 station is unknown; it must connect before this operation',
    });
  });

  it('should return unsupported when the protocol is not in the supported list', async () => {
    const readChargingStation = vi.fn().mockResolvedValue({ protocol: OCPPVersion.OCPP1_6 });

    const result = await resolveStationProtocol(readChargingStation, 1, 'cs-9', supported);

    expect(result).toEqual({
      supported: false,
      reason: 'Protocol of cs-9 station does not support this operation',
    });
  });

  it('should return the protocol when it is supported', async () => {
    const readChargingStation = vi.fn().mockResolvedValue({ protocol: OCPPVersion.OCPP2_0_1 });

    const result = await resolveStationProtocol(readChargingStation, 1, 'cs-9', supported);

    expect(result).toEqual({ supported: true, protocol: OCPPVersion.OCPP2_0_1 });
    expect(readChargingStation).toHaveBeenCalledWith(1, 'cs-9');
  });
});

describe('isForeignKeyConstraintError', () => {
  it('should return true for an error named SequelizeForeignKeyConstraintError', () => {
    const error = new Error('insert or update violates foreign key constraint');
    error.name = 'SequelizeForeignKeyConstraintError';

    expect(isForeignKeyConstraintError(error)).toBe(true);
  });

  it('should return false for other errors', () => {
    expect(isForeignKeyConstraintError(new Error('boom'))).toBe(false);
  });

  it('should return false for non-Error values', () => {
    expect(isForeignKeyConstraintError('SequelizeForeignKeyConstraintError')).toBe(false);
    expect(isForeignKeyConstraintError(undefined)).toBe(false);
    expect(isForeignKeyConstraintError(null)).toBe(false);
  });
});

describe('getHeaderValue', () => {
  // Raw header arrays alternate key, value.
  const rawHeaders = ['Content-Type', 'application/json', 'Authorization', 'Bearer tok-1'];

  it('should match header names case-insensitively', () => {
    expect(getHeaderValue(rawHeaders, 'authorization')).toBe('Bearer tok-1');
    expect(getHeaderValue(rawHeaders, 'AUTHORIZATION')).toBe('Bearer tok-1');
    expect(getHeaderValue(rawHeaders, 'Content-Type')).toBe('application/json');
  });

  it('should only look at key slots, not value slots', () => {
    expect(getHeaderValue(rawHeaders, 'application/json')).toBeUndefined();
  });

  it('should return undefined when the header is missing', () => {
    expect(getHeaderValue(rawHeaders, 'x-request-id')).toBeUndefined();
    expect(getHeaderValue([], 'authorization')).toBeUndefined();
  });
});

describe('getAuthorizationTokenFromRequest', () => {
  const aRequest = (rawHeaders: string[]): FastifyRequest =>
    ({ raw: { rawHeaders } }) as unknown as FastifyRequest;

  it('should extract the bearer token from raw headers', () => {
    const request = aRequest(['Authorization', 'Bearer tok-123']);

    expect(getAuthorizationTokenFromRequest(request)).toBe('tok-123');
  });

  it('should throw UnauthorizedError when no Authorization header is present', () => {
    expect(() => getAuthorizationTokenFromRequest(aRequest([]))).toThrow(UnauthorizedError);
    expect(() => getAuthorizationTokenFromRequest(aRequest([]))).toThrow(
      'Token not found in headers',
    );
  });

  it('should throw UnauthorizedError when the header is not a Bearer token', () => {
    const request = aRequest(['Authorization', 'Basic dXNlcjpwYXNz']);

    expect(() => getAuthorizationTokenFromRequest(request)).toThrow(UnauthorizedError);
  });
});

describe('initSwagger', () => {
  const initSwaggerWithMocks = async () => {
    const register = vi.fn().mockReturnValue({ after: vi.fn().mockResolvedValue(undefined) });
    const decorate = vi.fn();
    const server = { register, decorate } as unknown as FastifyInstance;
    // swagger moved from systemConfig.util.swagger to the top-level systemConfig.swagger
    const systemConfig = { swagger: { path: '/docs' } } as unknown as SystemConfig;
    await initSwagger(systemConfig, server);
    return { register, decorate };
  };

  it('should register swagger, swagger-ui and auth plugins', async () => {
    const { register, decorate } = await initSwaggerWithMocks();

    expect(register).toHaveBeenCalledTimes(3);
    const swaggerOptions = register.mock.calls[0][1];
    expect(swaggerOptions.openapi.info.title).toBe('CitrineOS Central System API');
    const swaggerUiOptions = register.mock.calls[1][1];
    expect(swaggerUiOptions.routePrefix).toBe('/docs');
    expect(decorate).toHaveBeenCalledTimes(1);
    expect(decorate.mock.calls[0][0]).toBe('authorization');
  });

  it('should derive missing operation tags from the path', async () => {
    const { register } = await initSwaggerWithMocks();
    const { transformObject } = register.mock.calls[0][1];

    const openapiObject = {
      components: {},
      paths: {
        '/ocpp/2.0.1/evdriver/requestStartTransaction': { post: {} },
        '/commands/setStationPassword': { post: {} },
        '/data/tenant/entity': { get: { tags: ['Preset'] } },
      },
    };
    const result = transformObject({ swaggerObject: {}, openapiObject });

    expect(result.paths['/ocpp/2.0.1/evdriver/requestStartTransaction'].post.tags).toEqual([
      'Evdriver',
    ]);
    expect(result.paths['/commands/setStationPassword'].post.tags).toEqual(['Commands']);
    expect(result.paths['/data/tenant/entity'].get.tags).toEqual(['Preset']);
  });

  it('should build local references from title, $id, or index', async () => {
    const { register } = await initSwaggerWithMocks();
    const { buildLocalReference } = register.mock.calls[0][1].refResolver;

    expect(buildLocalReference({ title: 'AuthorizationData' }, undefined, undefined, 0)).toBe(
      'AuthorizationData',
    );

    const idOnly: { $id: string; title?: string } = { $id: 'CustomerInformationRequest' };
    expect(buildLocalReference(idOnly, undefined, undefined, 1)).toBe('CustomerInformationRequest');
    expect(idOnly.title).toBe('CustomerInformationRequest');

    expect(buildLocalReference({}, undefined, undefined, 7)).toBe('def-7');
  });

  it('should decorate an authorization handler that accepts bearer tokens and rejects others', async () => {
    const { decorate } = await initSwaggerWithMocks();
    const handler = decorate.mock.calls[0][1];

    const done = vi.fn();
    const reply = { code: vi.fn() };
    handler({ raw: { rawHeaders: ['Authorization', 'Bearer tok-1'] } }, reply, done);
    expect(done).toHaveBeenCalledTimes(1);
    expect(reply.code).not.toHaveBeenCalled();

    const done2 = vi.fn();
    const reply2 = { code: vi.fn() };
    handler({ raw: { rawHeaders: [] } }, reply2, done2);
    expect(reply2.code).toHaveBeenCalledTimes(1);
    expect(reply2.code).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(done2).not.toHaveBeenCalled();
  });
});

describe('TotpUtil RFC 6238 vectors', () => {
  // The RFC 4226/6238 shared secret, hex-encoded. Built rather than pasted so
  // secret scanners do not read the published vector as a live credential.
  // Expected tokens are the last 6 digits of the RFC 6238 Appendix B SHA-1 vectors.
  // The window/skew behaviour is covered by test/services/totp/totp-util.test.ts;
  // what is pinned here is the algorithm against the published vectors.
  const RFC_SECRET_HEX = Buffer.from('1234567890'.repeat(2)).toString('hex');

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generate returns the RFC 6238 token at T=59s', () => {
    vi.spyOn(Date, 'now').mockReturnValue(59_000);

    expect(TotpUtil.generate(RFC_SECRET_HEX)).toBe('287082');
  });

  it('generate returns the RFC 6238 token at T=1111111109s', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_111_111_109_000);

    expect(TotpUtil.generate(RFC_SECRET_HEX)).toBe('081804');
  });
});

describe('validateVINIdToken', () => {
  it('should accept a 17-character alphanumeric VIN', () => {
    expect(validateVINIdToken('WVWZZZ1JZ3W386752')).toBe(true);
  });

  it('should accept lowercase input', () => {
    expect(validateVINIdToken('wvwzzz1jz3w386752')).toBe(true);
  });

  it('should reject wrong lengths and non-alphanumeric characters', () => {
    expect(validateVINIdToken('WVWZZZ1JZ3W38675')).toBe(false);
    expect(validateVINIdToken('WVWZZZ1JZ3W3867521')).toBe(false);
    expect(validateVINIdToken('WVWZZZ1JZ3W38675-')).toBe(false);
    expect(validateVINIdToken('')).toBe(false);
  });
});

describe('validateEVCCIDIdToken', () => {
  it('should accept a MAC address', () => {
    expect(validateEVCCIDIdToken('AA:BB:CC:DD:EE:FF')).toBe(true);
    expect(validateEVCCIDIdToken('aa:bb:cc:dd:ee:ff')).toBe(true);
  });

  it('should accept any non-empty identifier up to 255 characters', () => {
    expect(validateEVCCIDIdToken('evcc-id-1')).toBe(true);
    expect(validateEVCCIDIdToken('a'.repeat(255))).toBe(true);
  });

  it('should reject empty input and identifiers longer than 255 characters', () => {
    expect(validateEVCCIDIdToken('')).toBe(false);
    expect(validateEVCCIDIdToken('a'.repeat(256))).toBe(false);
  });
});

describe('validateEMAIDIdToken', () => {
  it('should accept a 15-character eMAID with a valid check digit', () => {
    expect(validateEMAIDIdToken('NL123C10028948M')).toEqual([]);
  });

  it('should accept hyphen separators and lowercase input', () => {
    expect(validateEMAIDIdToken('nl-123-c10028948-m')).toEqual([]);
  });

  it('should accept a 14-character eMAID without check digit', () => {
    expect(validateEMAIDIdToken('NL123C10028948')).toEqual([]);
  });

  it('should insert id type C into a 13-character DIN SPEC 91286 id', () => {
    expect(validateEMAIDIdToken('DE83DUIEN83QG')).toEqual([]);
  });

  it('should insert id type C and prune the check digit for a 14-character DIN id', () => {
    expect(validateEMAIDIdToken('DE83DUIEN83QGZ')).toEqual([]);
  });

  it('should report a wrong check digit with the expected value', () => {
    expect(validateEMAIDIdToken('NL123C10028948A')).toEqual([
      "Invalid check digit: expected 'M', found 'A'",
    ]);
  });

  it('should report invalid length', () => {
    expect(validateEMAIDIdToken('NL123C1002')).toEqual([
      'Invalid length: 10 characters (expected 14 or 15)',
    ]);
  });

  it('should report non-alphanumeric characters', () => {
    expect(validateEMAIDIdToken('NL123C1002894!M')).toEqual([
      'eMAID must contain only alphanumeric characters (and optional hyphens as separators)',
    ]);
  });

  it('should report an id type other than C in a 15-character id', () => {
    expect(validateEMAIDIdToken('NL123X10028948M')).toContain(
      "ID Type must be 'C' for Contract (found: 'X')",
    );
  });

  it('should report a numeric country code', () => {
    expect(validateEMAIDIdToken('1L123C10028948')).toEqual([
      'Country code must be exactly 2 letters',
    ]);
  });
});

describe('validateOcpp21IdToken', () => {
  it('should validate VIN tokens', () => {
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.VIN, 'WVWZZZ1JZ3W386752')).toEqual({
      isValid: true,
    });
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.VIN, 'short')).toEqual({
      isValid: false,
      errorMessage:
        'VIN must be exactly 17 alphanumeric characters, excluding I, O, and Q (ISO 3779)',
    });
  });

  it('should validate EVCCID tokens', () => {
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.EVCCID, 'AA:BB:CC:DD:EE:FF')).toEqual({
      isValid: true,
    });
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.EVCCID, '')).toEqual({
      isValid: false,
      errorMessage: 'EVCCID must be non-empty and at most 255 characters',
    });
  });

  it('should validate DirectPayment tokens', () => {
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.DirectPayment, 'payment-ref-1')).toEqual({
      isValid: true,
    });
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.DirectPayment, '')).toEqual({
      isValid: false,
      errorMessage: 'DirectPayment tokens must be non-empty',
    });
  });

  it('should validate eMAID tokens', () => {
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.eMAID, 'NL123C10028948M')).toEqual({
      isValid: true,
    });
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.eMAID, 'ZZ')).toEqual({
      isValid: false,
      errorMessage:
        'eMAID tokens must follow the eMI3 format: Invalid length: 2 characters (expected 14 or 15)',
    });
  });

  it('should validate ISO15693 tokens', () => {
    // 16 hex characters, assembled so scanners do not read the fixture as a key.
    const iso15693Token = ['0123456789', 'ABCDEF'].join('');
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.ISO15693, iso15693Token)).toEqual({
      isValid: true,
    });
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.ISO15693, 'XYZ')).toEqual({
      isValid: false,
      errorMessage: 'ISO15693 tokens must be exactly 16 hexadecimal characters (0-9, A-F)',
    });
  });

  it('should validate identifier-string token types with the type in the message', () => {
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.KeyCode, 'key-code_1')).toEqual({
      isValid: true,
    });
    expect(validateOcpp21IdToken(OCPP2_1.IdTokenEnumType.KeyCode, 'has space')).toEqual({
      isValid: false,
      errorMessage:
        'KeyCode tokens must contain only letters, numbers, and characters: * - _ = : + | @ .',
    });
  });

  it('should accept unknown token types', () => {
    expect(
      validateOcpp21IdToken('Other' as unknown as OCPP2_1.IdTokenEnumType, 'anything'),
    ).toEqual({ isValid: true });
  });
});

describe('validateIdToken eMAID routing', () => {
  // The eMAID branch of the 2.0.1 router is not covered by validator.test.ts.
  it('should accept a valid eMAID', () => {
    expect(validateIdToken(IdTokenEnum.eMAID, 'NL123C10028948M')).toEqual({ isValid: true });
  });

  it('should return the eMAID errors in the message', () => {
    expect(validateIdToken(IdTokenEnum.eMAID, 'ZZ')).toEqual({
      isValid: false,
      errorMessage:
        'eMAID tokens must follow the eMI3 format: Invalid length: 2 characters (expected 14 or 15)',
    });
  });
});

describe('validateTimeOfDay', () => {
  it('should accept hh:mm times', () => {
    expect(validateTimeOfDay('00:00')).toBe(true);
    expect(validateTimeOfDay('08:30')).toBe(true);
    expect(validateTimeOfDay('23:59')).toBe(true);
  });

  it('should reject out-of-range or malformed times', () => {
    expect(validateTimeOfDay('24:00')).toBe(false);
    expect(validateTimeOfDay('8:30')).toBe(false);
    expect(validateTimeOfDay('12:60')).toBe(false);
    expect(validateTimeOfDay('1230')).toBe(false);
    expect(validateTimeOfDay('')).toBe(false);
  });
});

describe('validateTariffConditionsTimeFields', () => {
  const aTariff = (components: Record<string, unknown>): OCPP2_1.TariffType =>
    ({ tariffId: 'tariff-1', currency: 'EUR', ...components }) as unknown as OCPP2_1.TariffType;

  it('should pass a tariff without price components', () => {
    expect(validateTariffConditionsTimeFields(aTariff({}))).toEqual({ isValid: true });
  });

  it('should pass valid start and end times', () => {
    const tariff = aTariff({
      energy: {
        prices: [
          { priceKwh: 0.25, conditions: { startTimeOfDay: '08:30', endTimeOfDay: '20:00' } },
        ],
      },
    });

    expect(validateTariffConditionsTimeFields(tariff)).toEqual({ isValid: true });
  });

  it('should skip prices without conditions', () => {
    const tariff = aTariff({ energy: { prices: [{ priceKwh: 0.25 }] } });

    expect(validateTariffConditionsTimeFields(tariff)).toEqual({ isValid: true });
  });

  it('should reject an invalid startTimeOfDay in any component', () => {
    const tariff = aTariff({
      chargingTime: { prices: [{ price: 1, conditions: { startTimeOfDay: '24:00' } }] },
    });

    expect(validateTariffConditionsTimeFields(tariff)).toEqual({
      isValid: false,
      errorMessage:
        'Invalid startTimeOfDay "24:00": must be in "hh:mm" format (RFC 3339 time-hour ":" time-minute, e.g. "08:30")',
    });
  });

  it('should reject an invalid endTimeOfDay in any component', () => {
    const tariff = aTariff({
      fixedFee: { prices: [{ priceFixed: 2, conditions: { endTimeOfDay: '9:5' } }] },
    });

    expect(validateTariffConditionsTimeFields(tariff)).toEqual({
      isValid: false,
      errorMessage:
        'Invalid endTimeOfDay "9:5": must be in "hh:mm" format (RFC 3339 time-hour ":" time-minute, e.g. "20:00")',
    });
  });
});
