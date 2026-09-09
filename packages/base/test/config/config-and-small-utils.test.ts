// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ErrorCode,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
  type OcppRequest,
  type OcppResponse,
  type OCPPVersionType,
} from '@citrineos/types';
import { ApiAuthenticationResult } from '@interfaces/api/auth/api-authentication-result.js';
import { ApiAuthorizationResult } from '@interfaces/api/auth/api-authorization-result.js';
import type { UserInfo } from '@interfaces/api/auth/user-info.js';
import { CrudRepository } from '@interfaces/repository.js';
import { MessageConfirmationSchema, QuerySchema } from '@ocpp/persistence/query-schema.js';
import { mapToCallAction, OcppError } from '@ocpp/rpc/message.js';
import { RequestBuilder } from '@base-util/request.js';

interface Widget {
  id: number;
  name: string;
}

const WIDGET: Widget = { id: 7, name: 'plug' };
const OTHER_WIDGET: Widget = { id: 8, name: 'socket' };

class StubRepository extends CrudRepository<Widget> {
  createResult: Widget = WIDGET;
  readAllResult: Widget[] = [];
  readOrCreateResult: [Widget, boolean] = [WIDGET, true];
  updateByKeyResult: Widget | undefined = WIDGET;
  updateAllResult: Widget[] = [];
  deleteByKeyResult: Widget | undefined = WIDGET;
  deleteAllResult: Widget[] = [];

  createSpy = vi.fn();
  readAllSpy = vi.fn();

  async readByKey(): Promise<Widget | undefined> {
    return undefined;
  }

  async readAllByQuery(tenantId: number, query: object, namespace?: string): Promise<Widget[]> {
    this.readAllSpy(tenantId, query, namespace);
    return this.readAllResult;
  }

  async readNextValue(): Promise<number> {
    return 0;
  }

  async existsByKey(): Promise<boolean> {
    return false;
  }

  async existByQuery(): Promise<number> {
    return 0;
  }

  protected async _create(tenantId: number, value: Widget, namespace?: string): Promise<Widget> {
    this.createSpy(tenantId, value, namespace);
    return this.createResult;
  }

  protected async _readOrCreateByQuery(): Promise<[Widget, boolean]> {
    return this.readOrCreateResult;
  }

  protected async _updateByKey(): Promise<Widget | undefined> {
    return this.updateByKeyResult;
  }

  protected async _updateAllByQuery(): Promise<Widget[]> {
    return this.updateAllResult;
  }

  protected async _deleteByKey(): Promise<Widget | undefined> {
    return this.deleteByKeyResult;
  }

  protected async _deleteAllByQuery(): Promise<Widget[]> {
    return this.deleteAllResult;
  }
}

describe('CrudRepository', () => {
  it('create persists through _create and emits created with the new row', async () => {
    const repo = new StubRepository();
    const created: Widget[][] = [];
    repo.on('created', (rows: Widget[]) => created.push(rows));
    const result = await repo.create(1, WIDGET, 'widgets');
    expect(result).toBe(WIDGET);
    expect(repo.createSpy).toHaveBeenCalledTimes(1);
    expect(repo.createSpy).toHaveBeenCalledWith(1, WIDGET, 'widgets');
    expect(created).toEqual([[WIDGET]]);
  });

  it('readOnlyOneByQuery returns the single match', async () => {
    const repo = new StubRepository();
    repo.readAllResult = [WIDGET];
    await expect(repo.readOnlyOneByQuery(1, { id: 7 })).resolves.toBe(WIDGET);
    expect(repo.readAllSpy).toHaveBeenCalledTimes(1);
    expect(repo.readAllSpy).toHaveBeenCalledWith(1, { id: 7 }, undefined);
  });

  it('readOnlyOneByQuery returns undefined when nothing matches', async () => {
    const repo = new StubRepository();
    await expect(repo.readOnlyOneByQuery(1, { id: 404 })).resolves.toBeUndefined();
  });

  it('readOnlyOneByQuery throws when the query matches more than one row', async () => {
    const repo = new StubRepository();
    repo.readAllResult = [WIDGET, OTHER_WIDGET];
    await expect(repo.readOnlyOneByQuery(1, { id: 7 })).rejects.toThrow(
      'More than one value found for query: {"id":7}',
    );
  });

  it('readOrCreateByQuery emits created only for a newly created row', async () => {
    const repo = new StubRepository();
    const created: Widget[][] = [];
    repo.on('created', (rows: Widget[]) => created.push(rows));
    repo.readOrCreateResult = [WIDGET, false];
    await expect(repo.readOrCreateByQuery(1, { id: 7 })).resolves.toEqual([WIDGET, false]);
    expect(created).toEqual([]);
    repo.readOrCreateResult = [OTHER_WIDGET, true];
    await repo.readOrCreateByQuery(1, { id: 8 });
    expect(created).toEqual([[OTHER_WIDGET]]);
  });

  it('updateByKey emits the row when found and an empty list when not', async () => {
    const repo = new StubRepository();
    const updated: Widget[][] = [];
    repo.on('updated', (rows: Widget[]) => updated.push(rows));
    await expect(repo.updateByKey(1, { name: 'renamed' }, '7')).resolves.toBe(WIDGET);
    repo.updateByKeyResult = undefined;
    await expect(repo.updateByKey(1, { name: 'renamed' }, 'missing')).resolves.toBeUndefined();
    expect(updated).toEqual([[WIDGET], []]);
  });

  it('deleteByKey emits an empty payload when nothing was removed', async () => {
    const repo = new StubRepository();
    const deleted: Widget[][] = [];
    repo.on('deleted', (rows: Widget[]) => deleted.push(rows));
    await expect(repo.deleteByKey(1, '7')).resolves.toBe(WIDGET);
    repo.deleteByKeyResult = undefined;
    await expect(repo.deleteByKey(1, 'missing')).resolves.toBeUndefined();
    expect(deleted).toEqual([[WIDGET], []]);
  });

  it('deleteAllByQuery emits every removed row', async () => {
    const repo = new StubRepository();
    repo.deleteAllResult = [WIDGET, OTHER_WIDGET];
    const deleted: Widget[][] = [];
    repo.on('deleted', (rows: Widget[]) => deleted.push(rows));
    await expect(repo.deleteAllByQuery(1, {})).resolves.toEqual([WIDGET, OTHER_WIDGET]);
    expect(deleted).toEqual([[WIDGET, OTHER_WIDGET]]);
  });
});

describe('RequestBuilder', () => {
  const TIMESTAMP = new Date('2026-01-02T03:04:05.000Z');

  afterEach(() => {
    vi.useRealTimers();
  });

  it('buildCall produces a Request-state message envelope', () => {
    const message = RequestBuilder.buildCall(
      'cs-001',
      'corr-1',
      7,
      OCPP_CallAction.Heartbeat,
      {} as OcppRequest,
      EventGroup.Configuration,
      MessageOrigin.ChargingStation,
      OCPPVersion.OCPP2_0_1,
      TIMESTAMP,
    );
    expect(message).toEqual({
      origin: MessageOrigin.ChargingStation,
      eventGroup: EventGroup.Configuration,
      action: OCPP_CallAction.Heartbeat,
      context: {
        ocppConnectionName: 'cs-001',
        correlationId: 'corr-1',
        tenantId: 7,
        timestamp: '2026-01-02T03:04:05.000Z',
      },
      state: MessageState.Request,
      protocol: OCPPVersion.OCPP2_0_1,
      payload: {},
    });
  });

  it('buildCallResult produces a Response-state message envelope', () => {
    const payload = { currentTime: '2026-01-01T00:00:00.000Z' } as OcppResponse;
    const message = RequestBuilder.buildCallResult(
      'cs-002',
      'corr-2',
      9,
      OCPP_CallAction.BootNotification,
      payload,
      EventGroup.Transactions,
      MessageOrigin.ChargingStationManagementSystem,
      OCPPVersion.OCPP1_6,
      TIMESTAMP,
    );
    expect(message.state).toBe(MessageState.Response);
    expect(message.protocol).toBe(OCPPVersion.OCPP1_6);
    expect(message.payload).toBe(payload);
    expect(message.context).toEqual({
      ocppConnectionName: 'cs-002',
      correlationId: 'corr-2',
      tenantId: 9,
      timestamp: '2026-01-02T03:04:05.000Z',
    });
  });

  it('buildCallError keeps the OcppError payload and Response state', () => {
    const error = new OcppError('corr-3', ErrorCode.InternalError, 'boom', { detail: 'x' });
    const message = RequestBuilder.buildCallError(
      'cs-003',
      'corr-3',
      11,
      OCPP_CallAction.Reset,
      error,
      EventGroup.EVDriver,
      MessageOrigin.ChargingStationManagementSystem,
      OCPPVersion.OCPP2_1,
      TIMESTAMP,
    );
    expect(message.state).toBe(MessageState.Response);
    expect(message.payload).toBe(error);
    expect(message.action).toBe(OCPP_CallAction.Reset);
    expect(message.context.correlationId).toBe('corr-3');
  });

  it('defaults the context timestamp to now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T04:05:06.789Z'));
    const message = RequestBuilder.buildCall(
      'cs-004',
      'corr-4',
      1,
      OCPP_CallAction.Heartbeat,
      {} as OcppRequest,
      EventGroup.Monitoring,
      MessageOrigin.ChargingStation,
      OCPPVersion.OCPP2_0_1,
    );
    expect(message.context.timestamp).toBe('2026-02-03T04:05:06.789Z');
  });
});

describe('mapToCallAction', () => {
  it('maps a shared action for every version', () => {
    expect(mapToCallAction(OCPPVersion.OCPP1_6, 'Heartbeat')).toBe(OCPP_CallAction.Heartbeat);
    expect(mapToCallAction(OCPPVersion.OCPP2_0_1, 'Heartbeat')).toBe(OCPP_CallAction.Heartbeat);
    expect(mapToCallAction(OCPPVersion.OCPP2_1, 'Heartbeat')).toBe(OCPP_CallAction.Heartbeat);
  });

  it('accepts 1.6-only actions on 1.6 and rejects them on 2.0.1', () => {
    expect(mapToCallAction(OCPPVersion.OCPP1_6, 'RemoteStartTransaction')).toBe(
      OCPP_CallAction.RemoteStartTransaction,
    );
    expect(() => mapToCallAction(OCPPVersion.OCPP2_0_1, 'RemoteStartTransaction')).toThrow(
      'Invalid OCPP 2.0.1 action: RemoteStartTransaction',
    );
  });

  it('accepts 2.0.1 actions on 2.0.1 and 2.1 but not on 1.6', () => {
    expect(mapToCallAction(OCPPVersion.OCPP2_0_1, 'RequestStartTransaction')).toBe(
      OCPP_CallAction.RequestStartTransaction,
    );
    expect(mapToCallAction(OCPPVersion.OCPP2_1, 'RequestStartTransaction')).toBe(
      OCPP_CallAction.RequestStartTransaction,
    );
    expect(() => mapToCallAction(OCPPVersion.OCPP1_6, 'RequestStartTransaction')).toThrow(
      'Invalid OCPP 1.6 action: RequestStartTransaction',
    );
  });

  it('accepts 2.1-only actions on 2.1 alone', () => {
    expect(mapToCallAction(OCPPVersion.OCPP2_1, 'BatterySwap')).toBe(OCPP_CallAction.BatterySwap);
    expect(() => mapToCallAction(OCPPVersion.OCPP2_0_1, 'BatterySwap')).toThrow(
      'Invalid OCPP 2.0.1 action: BatterySwap',
    );
  });

  it('rejects an unknown action name', () => {
    expect(() => mapToCallAction(OCPPVersion.OCPP2_1, 'NotARealAction')).toThrow(
      'Invalid OCPP 2.1 action: NotARealAction',
    );
  });

  it('rejects an empty action', () => {
    expect(() => mapToCallAction(OCPPVersion.OCPP2_0_1, '')).toThrow(
      'Action must be a non-empty string',
    );
  });

  it('rejects an unsupported version', () => {
    expect(() => mapToCallAction('ocpp9.9' as OCPPVersionType, 'Heartbeat')).toThrow(
      'Unsupported OCPP version: ocpp9.9',
    );
  });
});

describe('QuerySchema', () => {
  it('builds properties, defaults, patterns, and the required list', () => {
    const schema = QuerySchema('StationQuerySchema', [
      { key: 'stationId', type: 'string', required: true, pattern: '^cs' },
      { key: 'limit', type: 'number', defaultValue: '10' },
    ]);
    expect(schema).toEqual({
      $id: 'StationQuerySchema',
      type: 'object',
      properties: {
        stationId: { type: 'string', default: undefined, pattern: '^cs' },
        limit: { type: 'number', default: '10', pattern: undefined },
      },
      required: ['stationId'],
    });
  });

  it('expands a [] type suffix into an array property and omits required when empty', () => {
    const schema = QuerySchema('TagQuerySchema', [{ key: 'tags', type: 'string[]' }]) as Record<
      string,
      Record<string, object>
    >;
    expect(schema.properties.tags).toEqual({ type: 'array', items: { type: 'string' } });
    expect('required' in schema).toBe(false);
  });

  it('marks success required on MessageConfirmationSchema', () => {
    expect(MessageConfirmationSchema).toMatchObject({
      $id: 'MessageConfirmationSchema',
      required: ['success'],
    });
  });
});

describe('ApiAuthenticationResult', () => {
  const A_USER: UserInfo = {
    id: 'u-1',
    name: 'Ada',
    email: 'ada@example.com',
    roles: ['admin'],
    tenantId: '1',
  };

  it('success carries the user and no error', () => {
    const result = ApiAuthenticationResult.success(A_USER);
    expect(result.isAuthenticated).toBe(true);
    expect(result.user).toBe(A_USER);
    expect(result.error).toBeUndefined();
  });

  it('failure carries the error and no user', () => {
    const result = ApiAuthenticationResult.failure('bad token');
    expect(result.isAuthenticated).toBe(false);
    expect(result.error).toBe('bad token');
    expect(result.user).toBeUndefined();
  });
});

describe('ApiAuthorizationResult', () => {
  it('success authorizes without an error', () => {
    const result = ApiAuthorizationResult.success();
    expect(result.isAuthorized).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('failure keeps the denial reason', () => {
    const result = ApiAuthorizationResult.failure('role missing');
    expect(result.isAuthorized).toBe(false);
    expect(result.error).toBe('role missing');
  });
});
