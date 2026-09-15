// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { validate } from 'class-validator';
import { BadRequestError } from 'routing-controllers';
import { Logger } from 'tslog';
import { z } from 'zod';

import {
  base64Decode,
  base64Encode,
  CountryCode,
  invalidClientCredentialsRoles,
  invalidServerCredentialsRoles,
  plainToClass,
} from '../../src/util/util.js';
import { ResponseGenerator } from '../../src/util/response-generator.js';
import * as Consts from '../../src/util/consts.js';
import { validateRole } from '../../src/util/validators/credentials-validators.js';
import { PaginatedParams } from '../../src/controllers/param/paginated-params.js';
import { BaseController } from '../../src/controllers/base-controller.js';
import { NotFoundException } from '../../src/exception/not-found-exception.js';
import { Role } from '../../src/model/role.js';
import type { CredentialsRoleDTO } from '../../src/model/dto/credentials-role-dto.js';

const credentialsRole = (role: Role, country_code = 'US', party_id = 'CPO'): CredentialsRoleDTO =>
  ({ role, country_code, party_id, business_details: { name: 'Test Co' } }) as CredentialsRoleDTO;

describe('Util', () => {
  describe('invalidClientCredentialsRoles', () => {
    it('accepts an all-EMSP list', () => {
      const roles = [credentialsRole(Role.EMSP), credentialsRole(Role.EMSP, 'DE', 'EMP')];
      expect(invalidClientCredentialsRoles(roles)).toBe(false);
    });

    it('flags a list containing a non-EMSP role', () => {
      const roles = [credentialsRole(Role.EMSP), credentialsRole(Role.CPO)];
      expect(invalidClientCredentialsRoles(roles)).toBe(true);
    });

    it('an empty list is valid', () => {
      expect(invalidClientCredentialsRoles([])).toBe(false);
    });
  });

  describe('invalidServerCredentialsRoles', () => {
    it('accepts an all-CPO list', () => {
      const roles = [credentialsRole(Role.CPO), credentialsRole(Role.CPO, 'DE', 'CPX')];
      expect(invalidServerCredentialsRoles(roles)).toBe(false);
    });

    it('flags a list containing a non-CPO role', () => {
      const roles = [credentialsRole(Role.CPO), credentialsRole(Role.HUB)];
      expect(invalidServerCredentialsRoles(roles)).toBe(true);
    });

    it('an empty list is valid', () => {
      expect(invalidServerCredentialsRoles([])).toBe(false);
    });
  });

  it('CountryCode lists the three supported markets', () => {
    expect(Object.values(CountryCode)).toEqual(['US', 'CA', 'MX']);
  });

  it('base64Encode produces standard base64', () => {
    expect(base64Encode('hello')).toBe('aGVsbG8=');
  });

  it('base64Decode reverses base64Encode, utf-8 included', () => {
    expect(base64Decode('aGVsbG8=')).toBe('hello');
    expect(base64Decode(base64Encode('token/äü+'))).toBe('token/äü+');
  });

  it('plainToClass drops non-exposed input by default, keeping class defaults', () => {
    const result = plainToClass(PaginatedParams, { offset: 5, limit: 20 } as PaginatedParams);
    expect(result).toBeInstanceOf(PaginatedParams);
    // PaginatedParams has no @Expose metadata, so both inputs are extraneous
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(10);
  });

  it('plainToClass copies everything when excludeExtraneousValues is off', () => {
    const result = plainToClass(
      PaginatedParams,
      { offset: 5, limit: 20 } as PaginatedParams,
      false,
    );
    expect(result.offset).toBe(5);
    expect(result.limit).toBe(20);
  });
});

describe('ResponseGenerator', () => {
  const NOW = new Date('2025-06-01T12:00:00.000Z');
  beforeAll(() => vi.useFakeTimers({ now: NOW }));
  afterAll(() => vi.useRealTimers());

  it('success envelope defaults its message to Success', () => {
    expect(ResponseGenerator.buildGenericSuccessResponse({ id: 7 })).toEqual({
      status_code: 1000,
      status_message: 'Success',
      data: { id: 7 },
      timestamp: NOW,
    });
  });

  it('success message can be overridden', () => {
    const res = ResponseGenerator.buildGenericSuccessResponse('d', 'Accepted');
    expect(res.status_message).toBe('Accepted');
    expect(res.status_code).toBe(1000);
  });

  it('server error prefers the explicit message over the error', () => {
    const res = ResponseGenerator.buildGenericServerErrorResponse(
      'd',
      'explicit',
      new Error('from error'),
    );
    expect(res).toEqual({
      status_code: 3000,
      status_message: 'explicit',
      data: 'd',
      timestamp: NOW,
    });
  });

  it('server error falls back to error.message, then to undefined', () => {
    const fromError = ResponseGenerator.buildGenericServerErrorResponse(
      undefined,
      undefined,
      new Error('boom'),
    );
    expect(fromError.status_message).toBe('boom');
    expect(ResponseGenerator.buildGenericServerErrorResponse().status_message).toBeUndefined();
  });

  it('client error envelope carries 2000', () => {
    const res = ResponseGenerator.buildGenericClientErrorResponse(
      null,
      undefined,
      new Error('bad input'),
    );
    expect(res).toEqual({
      status_code: 2000,
      status_message: 'bad input',
      data: null,
      timestamp: NOW,
    });
  });

  it('unknown location envelope carries 2003', () => {
    const res = ResponseGenerator.buildUnknownLocationResponse(undefined, 'no such location');
    expect(res).toEqual({
      status_code: 2003,
      status_message: 'no such location',
      data: undefined,
      timestamp: NOW,
    });
  });

  it('invalid or missing parameters envelope carries 2001', () => {
    const res = ResponseGenerator.buildInvalidOrMissingParametersResponse(
      'x',
      undefined,
      new Error('missing uid'),
    );
    expect(res).toEqual({
      status_code: 2001,
      status_message: 'missing uid',
      data: 'x',
      timestamp: NOW,
    });
  });

  it('unknown session delegates to the generic client error', () => {
    const res = ResponseGenerator.buildUnknownSessionResponse(
      'nope',
      new NotFoundException('Session 9 not found'),
    );
    expect(res).toEqual({
      status_code: 2000,
      status_message: 'Session 9 not found',
      data: 'nope',
      timestamp: NOW,
    });
  });
});

describe('Consts', () => {
  it('component and variable names match what core exposes', () => {
    expect(Consts.EVSE_COMPONENT).toBe('EVSE');
    expect(Consts.CONNECTOR_COMPONENT).toBe('Connector');
    expect(Consts.AUTH_CONTROLLER_COMPONENT).toBe('AuthCtrlr');
    expect(Consts.TOKEN_READER_COMPONENT).toBe('TokenReader');
    expect(Consts.AVAILABILITY_STATE_VARIABLE).toBe('AvailabilityState');
  });

  it('markers and cache keys are stable', () => {
    expect(Consts.UNKNOWN_ID).toBe('UNKNOWN');
    expect(Consts.NOT_APPLICABLE).toBe('N/A');
    expect(Consts.MINUTES_IN_HOUR).toBe(60);
    expect(Consts.CREATE).toBe('create');
    expect(Consts.UPDATE).toBe('update');
    expect(Consts.COMMAND_RESPONSE_URL_CACHE_NAMESPACE).toBe('commands');
    expect(Consts.COMMAND_RESPONSE_URL_CACHE_RESOLVED).toBe('resolved');
  });
});

describe('validateRole', () => {
  it('passes silently when every entry has the expected role', () => {
    const roles = [credentialsRole(Role.CPO), credentialsRole(Role.CPO, 'DE', 'CPX')];
    expect(validateRole(roles, Role.CPO)).toBeUndefined();
  });

  it('an empty list passes for any role', () => {
    expect(validateRole([], Role.EMSP)).toBeUndefined();
  });

  it('rejects an entry with a different role, naming it', () => {
    const roles = [credentialsRole(Role.CPO), credentialsRole(Role.EMSP, 'DE', 'EMP')];
    expect(() => validateRole(roles, Role.CPO)).toThrow(BadRequestError);
    expect(() => validateRole(roles, Role.CPO)).toThrow('country_code DE and party_id EMP');
  });
});

describe('PaginatedParams', () => {
  it('defaults to offset 0 and limit 10 with no dates', async () => {
    const params = new PaginatedParams();
    expect(params.offset).toBe(0);
    expect(params.limit).toBe(10);
    expect(params.dateFrom).toBeUndefined();
    expect(params.dateTo).toBeUndefined();
    expect(await validate(params)).toEqual([]);
  });

  it('rejects a negative offset', async () => {
    const params = new PaginatedParams();
    params.offset = -1;
    const errors = await validate(params);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('offset');
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('rejects limit 0, the minimum is 1', async () => {
    const params = new PaginatedParams();
    params.limit = 0;
    const errors = await validate(params);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('limit');
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('rejects a fractional offset', async () => {
    const params = new PaginatedParams();
    params.offset = 2.5;
    const errors = await validate(params);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('offset');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });

  it('rejects a malformed date_from', async () => {
    const params = new PaginatedParams();
    (params as any).date_from = 'yesterday';
    const errors = await validate(params);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('date_from');
    expect(errors[0].constraints).toHaveProperty('isDateString');
  });

  it('date setters store ISO strings the getters rehydrate', () => {
    const params = new PaginatedParams();
    const from = new Date('2025-01-02T03:04:05.000Z');
    const to = new Date('2025-02-03T04:05:06.000Z');
    params.dateFrom = from;
    params.dateTo = to;
    expect((params as any).date_from).toBe('2025-01-02T03:04:05.000Z');
    expect((params as any).date_to).toBe('2025-02-03T04:05:06.000Z');
    expect(params.dateFrom).toEqual(from);
    expect(params.dateTo).toEqual(to);
  });

  it('assigning undefined keeps the previously set date', () => {
    const params = new PaginatedParams();
    params.dateFrom = new Date('2025-01-02T03:04:05.000Z');
    params.dateFrom = undefined;
    params.dateTo = undefined;
    expect(params.dateFrom).toEqual(new Date('2025-01-02T03:04:05.000Z'));
    expect(params.dateTo).toBeUndefined();
  });
});

describe('BaseController mock generators', () => {
  const controller = new BaseController({ logger: new Logger({ minLevel: 6 }) });
  // defaults make json-schema-faker deterministic (useDefaultValue: true)
  const schema = z.object({
    id: z.string().default('abc'),
    count: z.number().int().default(7),
  });

  it('generateMockOcpiResponse fabricates data from schema defaults', async () => {
    await expect(controller.generateMockOcpiResponse(schema, 'Sample')).resolves.toEqual({
      id: 'abc',
      count: 7,
    });
  });

  it('paginated mock falls back to limit 10 and offset 0 without params', async () => {
    const res = await controller.generateMockOcpiPaginatedResponse(schema, 'Sample');
    expect(res).toEqual({ id: 'abc', count: 7, limit: 10, offset: 0, total: 50 });
  });

  it('paginated mock takes limit and offset from PaginatedParams', async () => {
    const params = new PaginatedParams();
    params.limit = 25;
    params.offset = 5;
    const res = await controller.generateMockOcpiPaginatedResponse(schema, 'Sample', params);
    expect(res.limit).toBe(25);
    expect(res.offset).toBe(5);
    expect(res.total).toBe(50);
  });

  it('generateMockForSchema resolves null when the faker throws', async () => {
    const generateMock = vi.fn(() => {
      throw new Error('gen fail');
    });
    vi.doMock('json-schema-faker', () => ({
      generate: generateMock,
      registerFormat: vi.fn(),
    }));
    vi.resetModules();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const mod = await import('../../src/controllers/base-controller.js');
      await expect(mod.generateMockForSchema(schema, 'Sample')).resolves.toBeNull();
      expect(generateMock).toHaveBeenCalledTimes(1);
      // the schema handed to the faker carries the converted zod shape plus components
      expect(generateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({ id: expect.anything() }),
          components: expect.objectContaining({ schemas: expect.any(Object) }),
        }),
        expect.objectContaining({ useDefaultValue: true, useExamplesValue: true }),
      );
      expect(logSpy).toHaveBeenCalledWith('err', expect.objectContaining({ message: 'gen fail' }));
    } finally {
      logSpy.mockRestore();
      vi.doUnmock('json-schema-faker');
      vi.resetModules();
    }
  });
});
