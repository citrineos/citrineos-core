// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { DtoEvent, DtoEventObjectType, DtoEventType } from '../../src/events/types.js';
import { AlreadyRegisteredException } from '../../src/exception/already-registered-exception.js';
import { InvalidParamException } from '../../src/exception/invalid-param-exception.js';
import { MissingParamException } from '../../src/exception/missing-param-exception.js';
import { NotFoundException } from '../../src/exception/not-found-exception.js';
import { NotRegisteredException } from '../../src/exception/not-registered-exception.js';
import { UnknownTokenException } from '../../src/exception/unknown-token-exception.js';
import { UnsuccessfulRequestException } from '../../src/exception/unsuccessful-request-exception.js';
import { WrongClientAccessException } from '../../src/exception/wrong-client-access-exception.js';
import { AuthMethod } from '../../src/model/auth-method.js';
import { CommandResultType } from '../../src/model/command-result.js';
import { Role } from '../../src/model/role.js';
import { SessionStatus } from '../../src/model/session-status.js';
import { TokenType } from '../../src/model/token-type.js';
import { VersionNumber } from '../../src/model/version-number.js';
import { GetCdrParamsSchema } from '../../src/trigger/param/cdrs/get-cdr-params.js';
import { PostCdrParamsSchema } from '../../src/trigger/param/cdrs/post-cdr-params.js';
import {
  buildPutChargingProfileParams,
  PutChargingProfileParamsSchema,
} from '../../src/trigger/param/charging-profiles/put-charging-profile-params.js';
import { PostCommandParamsSchema } from '../../src/trigger/param/commands/post-command-params.js';
import {
  buildPostCredentialsParams,
  PostCredentialsParamsSchema,
} from '../../src/trigger/param/credentials/post-credentials-params.js';
import { buildPutCredentialsParams } from '../../src/trigger/param/credentials/put-credentials-params.js';
import {
  buildPaginatedOcpiParams,
  PaginatedOcpiParamsSchema,
} from '../../src/trigger/param/paginated-ocpi-params.js';
import {
  buildPaginatedParams,
  PaginatedParamsSchema,
} from '../../src/trigger/param/paginated-params.js';
import { GetSessionParamsSchema } from '../../src/trigger/param/sessions/get-session-params.js';
import { PatchSessionParamsSchema } from '../../src/trigger/param/sessions/patch-session-params.js';
import { PutSessionParamsSchema } from '../../src/trigger/param/sessions/put-session-params.js';
import { PostTokenParamsSchema } from '../../src/trigger/param/tokens/post-token-params.js';

const ocpi = {
  fromCountryCode: 'US',
  fromPartyId: 'CPO',
  toCountryCode: 'DE',
  toPartyId: 'MSP',
};

const uuid36 = '123e4567-e89b-12d3-a456-426614174000';

const credentials = {
  token: 'token-123',
  url: 'https://example.com/ocpi/versions',
  roles: [
    {
      role: Role.CPO,
      party_id: 'CPO',
      country_code: 'US',
      business_details: { name: 'Example CPO' },
    },
  ],
};

// dotted issue paths of a failed parse; empty array when the input is valid
const issuePaths = (schema: z.ZodType, input: unknown): string[] => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
};

describe('PaginatedParams', () => {
  it('build with no args falls back to offset 0 / limit 10', () => {
    expect(buildPaginatedParams()).toEqual({ offset: 0, limit: 10 });
  });

  it('build keeps explicit paging and date bounds', () => {
    const from = new Date('2025-01-01T00:00:00.000Z');
    const to = new Date('2025-02-01T00:00:00.000Z');
    const params = buildPaginatedParams(20, 50, from, to);
    expect(params.offset).toBe(20);
    expect(params.limit).toBe(50);
    expect((params.date_from as Date).getTime()).toBe(from.getTime());
    expect((params.date_to as Date).getTime()).toBe(to.getTime());
  });

  it('schema rejects negative offset and zero limit', () => {
    expect(issuePaths(PaginatedParamsSchema, { offset: -1 })).toEqual(['offset']);
    expect(issuePaths(PaginatedParamsSchema, { limit: 0 })).toEqual(['limit']);
  });
});

describe('PaginatedOcpiParams', () => {
  it('build applies paging defaults and keeps the routing fields', () => {
    const params = buildPaginatedOcpiParams('DE', 'MSP', 'US', 'CPO', 'Token abc');
    expect(params.offset).toBe(0);
    expect(params.limit).toBe(10);
    expect(params.toCountryCode).toBe('DE');
    expect(params.toPartyId).toBe('MSP');
    expect(params.fromCountryCode).toBe('US');
    expect(params.fromPartyId).toBe('CPO');
  });

  it('build passes explicit paging through', () => {
    const from = new Date('2025-03-01T00:00:00.000Z');
    const params = buildPaginatedOcpiParams('DE', 'MSP', 'US', 'CPO', 'Token abc', 30, 100, from);
    expect(params.offset).toBe(30);
    expect(params.limit).toBe(100);
    expect((params.date_from as Date).getTime()).toBe(from.getTime());
  });

  it('schema rejects a 3-letter country code', () => {
    expect(issuePaths(PaginatedOcpiParamsSchema, { ...ocpi, fromCountryCode: 'USA' })).toEqual([
      'fromCountryCode',
    ]);
  });
});

describe('cdr params', () => {
  it('GetCdrParams accepts a well-formed url', () => {
    const parsed = GetCdrParamsSchema.parse({ ...ocpi, url: 'https://example.com/cdrs/1' });
    expect(parsed.url).toBe('https://example.com/cdrs/1');
    expect(parsed.toPartyId).toBe('MSP');
  });

  it('GetCdrParams rejects a non-url', () => {
    expect(issuePaths(GetCdrParamsSchema, { ...ocpi, url: 'not a url' })).toEqual(['url']);
  });

  it('PostCdrParams requires the cdr body', () => {
    expect(issuePaths(PostCdrParamsSchema, { ...ocpi })).toEqual(['cdr']);
  });
});

describe('PutChargingProfileParams', () => {
  const activeChargingProfile = {
    start_date_time: new Date('2025-06-01T10:00:00.000Z'),
    charging_profile: { charging_rate_unit: 'W' },
  };

  it('build returns all six fields verbatim', () => {
    const params = buildPutChargingProfileParams(
      'sess-1',
      activeChargingProfile,
      'US',
      'CPO',
      'DE',
      'MSP',
    );
    expect(params).toEqual({
      sessionId: 'sess-1',
      activeChargingProfile,
      fromCountryCode: 'US',
      fromPartyId: 'CPO',
      toCountryCode: 'DE',
      toPartyId: 'MSP',
    });
  });

  it('schema coerces the profile start date from a string', () => {
    const parsed = PutChargingProfileParamsSchema.parse({
      sessionId: 'sess-1',
      activeChargingProfile: {
        start_date_time: '2025-06-01T10:00:00.000Z',
        charging_profile: { charging_rate_unit: 'W' },
      },
      ...ocpi,
    });
    expect(parsed.activeChargingProfile.start_date_time).toBeInstanceOf(Date);
    expect(parsed.activeChargingProfile.start_date_time.toISOString()).toBe(
      '2025-06-01T10:00:00.000Z',
    );
  });

  it('schema rejects an empty sessionId', () => {
    expect(
      issuePaths(PutChargingProfileParamsSchema, {
        sessionId: '',
        activeChargingProfile: {
          start_date_time: '2025-06-01T10:00:00.000Z',
          charging_profile: { charging_rate_unit: 'W' },
        },
        ...ocpi,
      }),
    ).toEqual(['sessionId']);
  });
});

describe('PostCommandParams', () => {
  it('accepts a command result', () => {
    const parsed = PostCommandParamsSchema.parse({
      ...ocpi,
      url: 'https://example.com/commands/START_SESSION/1',
      commandResult: { result: CommandResultType.ACCEPTED },
    });
    expect(parsed.commandResult.result).toBe('ACCEPTED');
    expect(parsed.url).toBe('https://example.com/commands/START_SESSION/1');
  });

  it('rejects an empty url', () => {
    expect(
      issuePaths(PostCommandParamsSchema, {
        ...ocpi,
        url: '',
        commandResult: { result: CommandResultType.FAILED },
      }),
    ).toEqual(['url']);
  });
});

describe('credentials params', () => {
  it('buildPostCredentialsParams spreads registration params and credentials', () => {
    const params = buildPostCredentialsParams(
      VersionNumber.TWO_DOT_TWO,
      'Token abc',
      credentials,
      'req-1',
      'corr-1',
    );
    expect(params).toEqual({
      authorization: 'Token abc',
      xRequestId: 'req-1',
      xCorrelationId: 'corr-1',
      version: VersionNumber.TWO_DOT_TWO,
      credentials,
    });
  });

  it('schema defaults version to 2.2.1 when omitted', () => {
    const parsed = PostCredentialsParamsSchema.parse({
      authorization: 'Token abc',
      credentials,
    });
    expect(parsed.version).toBe('2.2.1');
    expect(parsed.credentials.roles[0].role).toBe(Role.CPO);
  });

  it('schema rejects credentials with an empty roles list', () => {
    expect(
      issuePaths(PostCredentialsParamsSchema, {
        authorization: 'Token abc',
        credentials: { ...credentials, roles: [] },
      }),
    ).toEqual(['credentials.roles']);
  });

  it('buildPutCredentialsParams returns authorization, version and credentials', () => {
    const params = buildPutCredentialsParams(
      VersionNumber.TWO_DOT_TWO_DOT_ONE,
      'Token xyz',
      credentials,
    );
    expect(params).toEqual({
      authorization: 'Token xyz',
      version: VersionNumber.TWO_DOT_TWO_DOT_ONE,
      credentials,
    });
  });
});

describe('session params', () => {
  const session = {
    country_code: 'US',
    party_id: 'CPO',
    id: uuid36,
    start_date_time: '2025-01-01T00:00:00.000Z',
    kwh: 12.5,
    cdr_token: { uid: 'UID-1', contract_id: 'C-1', country_code: 'US', party_id: 'CPO' },
    auth_method: AuthMethod.WHITELIST,
    location_id: 'LOC-1',
    evse_uid: 'EVSE-1',
    connector_id: '1',
    currency: 'USD',
    status: SessionStatus.ACTIVE,
    last_updated: '2025-01-02T00:00:00.000Z',
  };

  it('GetSessionParams accepts a 36-char sessionId', () => {
    const parsed = GetSessionParamsSchema.parse({ ...ocpi, sessionId: uuid36 });
    expect(parsed.sessionId).toBe(uuid36);
  });

  it('GetSessionParams rejects a shorter id', () => {
    expect(issuePaths(GetSessionParamsSchema, { ...ocpi, sessionId: 'short' })).toEqual([
      'sessionId',
    ]);
  });

  it('PutSessionParams coerces session dates', () => {
    const parsed = PutSessionParamsSchema.parse({ ...ocpi, sessionId: uuid36, session });
    expect(parsed.session.start_date_time.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    expect(parsed.session.last_updated.toISOString()).toBe('2025-01-02T00:00:00.000Z');
    expect(parsed.session.kwh).toBe(12.5);
    expect(parsed.session.status).toBe('ACTIVE');
  });

  it('PutSessionParams requires the session body', () => {
    expect(issuePaths(PutSessionParamsSchema, { ...ocpi, sessionId: uuid36 })).toEqual(['session']);
  });

  it('PatchSessionParams accepts an empty partial body', () => {
    const parsed = PatchSessionParamsSchema.parse({
      ...ocpi,
      sessionId: uuid36,
      requestBody: {},
    });
    expect(parsed.requestBody).toEqual({});
  });

  it('PatchSessionParams keeps a single patched field', () => {
    const parsed = PatchSessionParamsSchema.parse({
      ...ocpi,
      sessionId: uuid36,
      requestBody: { kwh: 7 },
    });
    expect(parsed.requestBody.kwh).toBe(7);
  });
});

describe('PostTokenParams', () => {
  it('accepts a token id with optional enums omitted', () => {
    const parsed = PostTokenParamsSchema.parse({ ...ocpi, tokenId: uuid36 });
    expect(parsed.tokenId).toBe(uuid36);
    expect(parsed.type).toBeUndefined();
    expect(parsed.version).toBeUndefined();
  });

  it('accepts type, version and location references', () => {
    const parsed = PostTokenParamsSchema.parse({
      ...ocpi,
      tokenId: uuid36,
      type: TokenType.RFID,
      version: VersionNumber.TWO_DOT_TWO_DOT_ONE,
      locationReferences: { location_id: 'LOC-1', evse_uids: ['EVSE-1'] },
    });
    expect(parsed.type).toBe('RFID');
    expect(parsed.version).toBe('2.2.1');
    expect(parsed.locationReferences).toEqual({ location_id: 'LOC-1', evse_uids: ['EVSE-1'] });
  });

  it('rejects an unknown token type', () => {
    expect(issuePaths(PostTokenParamsSchema, { ...ocpi, tokenId: uuid36, type: 'BAD' })).toEqual([
      'type',
    ]);
  });
});

describe('exceptions', () => {
  it('AlreadyRegisteredException has a fixed message', () => {
    const e = new AlreadyRegisteredException();
    expect(e.message).toBe('Already registered');
    expect(e.name).toBe('AlreadyRegisteredException');
    expect(e).toBeInstanceOf(Error);
  });

  it('NotRegisteredException has a fixed message and throws with it', () => {
    const e = new NotRegisteredException();
    expect(e.message).toBe('Not registered');
    expect(e.name).toBe('NotRegisteredException');
    expect(() => {
      throw new NotRegisteredException();
    }).toThrow('Not registered');
  });

  // names of the next four diverge from their class names in src
  it('InvalidParamException uses name InvalidParam', () => {
    const e = new InvalidParamException('bad offset');
    expect(e.message).toBe('bad offset');
    expect(e.name).toBe('InvalidParam');
  });

  it('MissingParamException uses name missingParam', () => {
    const e = new MissingParamException('offset required');
    expect(e.message).toBe('offset required');
    expect(e.name).toBe('missingParam');
  });

  it('UnknownTokenException uses name UnknownToken', () => {
    const e = new UnknownTokenException('token 42 unknown');
    expect(e.message).toBe('token 42 unknown');
    expect(e.name).toBe('UnknownToken');
  });

  it('WrongClientAccessException uses name WrongClientAccess', () => {
    const e = new WrongClientAccessException('client mismatch');
    expect(e.message).toBe('client mismatch');
    expect(e.name).toBe('WrongClientAccess');
  });

  it('NotFoundException keeps its message', () => {
    const e = new NotFoundException('session not found');
    expect(e.message).toBe('session not found');
    expect(e.name).toBe('NotFoundException');
  });

  it('UnsuccessfulRequestException stores the rest response', () => {
    const response = { statusCode: 422, result: null, headers: {} };
    const e = new UnsuccessfulRequestException('PUT session failed', response);
    expect(e.message).toBe('PUT session failed');
    expect(e.name).toBe('UnsuccessfulRequestException');
    expect(e.iRestResponse).toBe(response);
  });

  it('UnsuccessfulRequestException without a response leaves the field undefined', () => {
    const e = new UnsuccessfulRequestException('GET failed');
    expect(e.iRestResponse).toBeUndefined();
    expect(e.message).toBe('GET failed');
  });
});

describe('DtoEvent', () => {
  it('exposes constructor args through getters', () => {
    const context = {
      eventType: DtoEventType.INSERT,
      objectType: DtoEventObjectType.Location,
    };
    const payload = { locationId: 'LOC-1' };
    const event = new DtoEvent('evt-1', context, payload);
    expect(event.eventId).toBe('evt-1');
    expect(event.payload).toBe(payload);
    expect(event.context.eventType).toBe(DtoEventType.INSERT);
    expect(event.context.objectType).toBe(DtoEventObjectType.Location);
  });

  it('explicit eventType and objectType args override the context values', () => {
    const context = {
      eventType: DtoEventType.INSERT,
      objectType: DtoEventObjectType.Location,
    };
    const event = new DtoEvent(
      'evt-2',
      context,
      {},
      DtoEventType.DELETE,
      DtoEventObjectType.Tariff,
    );
    expect(event.context).toEqual({
      eventType: DtoEventType.DELETE,
      objectType: DtoEventObjectType.Tariff,
    });
  });

  it('DtoEventType covers the three mutations', () => {
    expect(Object.values(DtoEventType)).toEqual(['INSERT', 'UPDATE', 'DELETE']);
  });

  it('DtoEventObjectType covers the seven object types', () => {
    expect(Object.values(DtoEventObjectType)).toEqual([
      'Location',
      'ChargingStation',
      'Evse',
      'Connector',
      'Transaction',
      'MeterValue',
      'Tariff',
    ]);
  });
});
