// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { MessageOrigin, MessageTypeId, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { OCPPMessageDto } from '@citrineos/types';
import { ChargingStation } from '@dal/db/sequelize/index.js';
import { DrizzleOCPPMessageRepository } from '@dal/repositories/drizzle/ocpp-message.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'cp001';
const OTHER_STATION = 'cp002';

let h: PgHarness;
let drizzlePool: pg.Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  h = await startPgHarness();
  drizzlePool = new pg.Pool({
    host: h.config.database.host,
    port: h.config.database.port,
    database: h.config.database.database,
    user: h.config.database.username,
    password: h.config.database.password,
  });
  drizzlePool.on('error', () => {});
  db = drizzle(drizzlePool);
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await h?.stop();
}, 90_000);

beforeEach(async () => {
  await resetDb(h);
});

function repo(): DrizzleOCPPMessageRepository {
  return new DrizzleOCPPMessageRepository({ config: h.config, drizzleInstance: db });
}

async function aStation(ocppConnectionName = STATION, tenantId = TENANT_A) {
  return ChargingStation.create({ ocppConnectionName, isOnline: true, tenantId } as any);
}

function aFrame(overrides: Partial<OCPPMessageDto> = {}): Omit<OCPPMessageDto, 'stationId'> {
  return {
    correlationId: 'corr-1',
    origin: MessageOrigin.ChargingStationManagementSystem,
    type: MessageTypeId.Call,
    protocol: OCPPVersion.OCPP2_0_1,
    action: OCPP_CallAction.GetDisplayMessages,
    payload: { requestId: 42 },
    raw: '[2,"corr-1","GetDisplayMessages",{"requestId":42}]',
    timestamp: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('DrizzleOCPPMessageRepository createOCPPMessage', () => {
  it('resolves the connection name to a station id and stores the frame', async () => {
    await aStation();

    const stored = await repo().createOCPPMessage(TENANT_A, STATION, aFrame());

    expect(stored.id).toBeDefined();
    expect(stored.correlationId).toBe('corr-1');
    expect(stored.action).toBe(OCPP_CallAction.GetDisplayMessages);
    expect(stored.payload).toEqual({ requestId: 42 });
    expect(stored.raw).toBe('[2,"corr-1","GetDisplayMessages",{"requestId":42}]');
    expect(stored.tenantId).toBe(TENANT_A);
  });

  it('returns the timestamp as an ISO string, not a Date', async () => {
    await aStation();

    const stored = await repo().createOCPPMessage(TENANT_A, STATION, aFrame());

    expect(stored.timestamp).toBe('2026-01-01T00:00:00.000Z');
  });

  it('throws when the connection name names no station in the tenant', async () => {
    await aStation();

    await expect(repo().createOCPPMessage(TENANT_A, 'ghost', aFrame())).rejects.toThrow(
      /no charging station named 'ghost'/,
    );
  });

  it('does not resolve a station that belongs to another tenant', async () => {
    await aStation(STATION, TENANT_B);

    await expect(repo().createOCPPMessage(TENANT_A, STATION, aFrame())).rejects.toThrow(
      /no charging station named 'cp001'/,
    );
  });
});

describe('DrizzleOCPPMessageRepository getRequestByCorrelationId', () => {
  it('returns the frame that has no requestMessageId', async () => {
    await aStation();
    const request = await repo().createOCPPMessage(TENANT_A, STATION, aFrame());

    const found = await repo().getRequestByCorrelationId(TENANT_A, 'corr-1');

    expect(found?.id).toBe(request.id);
    expect(found?.requestMessageId).toBeUndefined();
  });

  it('returns undefined for a correlationId that was never stored', async () => {
    await aStation();
    await repo().createOCPPMessage(TENANT_A, STATION, aFrame());

    expect(await repo().getRequestByCorrelationId(TENANT_A, 'corr-absent')).toBeUndefined();
  });

  it('does not cross tenants', async () => {
    await aStation();
    await repo().createOCPPMessage(TENANT_A, STATION, aFrame());

    expect(await repo().getRequestByCorrelationId(TENANT_B, 'corr-1')).toBeUndefined();
  });
});

describe('DrizzleOCPPMessageRepository hasMessageWithPayloadRequestId', () => {
  it('finds a stored frame by action and payload requestId', async () => {
    await aStation();
    await repo().createOCPPMessage(TENANT_A, STATION, aFrame());

    await expect(
      repo().hasMessageWithPayloadRequestId(
        TENANT_A,
        STATION,
        OCPP_CallAction.GetDisplayMessages,
        42,
      ),
    ).resolves.toBe(true);
  });

  it('does not match a different requestId', async () => {
    await aStation();
    await repo().createOCPPMessage(TENANT_A, STATION, aFrame());

    await expect(
      repo().hasMessageWithPayloadRequestId(
        TENANT_A,
        STATION,
        OCPP_CallAction.GetDisplayMessages,
        43,
      ),
    ).resolves.toBe(false);
  });

  it('does not match the same requestId under a different action', async () => {
    await aStation();
    await repo().createOCPPMessage(TENANT_A, STATION, aFrame());

    await expect(
      repo().hasMessageWithPayloadRequestId(
        TENANT_A,
        STATION,
        OCPP_CallAction.CustomerInformation,
        42,
      ),
    ).resolves.toBe(false);
  });

  it('does not match a frame stored for another station', async () => {
    await aStation();
    await aStation(OTHER_STATION);
    await repo().createOCPPMessage(TENANT_A, OTHER_STATION, aFrame());

    await expect(
      repo().hasMessageWithPayloadRequestId(
        TENANT_A,
        STATION,
        OCPP_CallAction.GetDisplayMessages,
        42,
      ),
    ).resolves.toBe(false);
  });

  it('returns false rather than throwing when the connection name resolves to no station', async () => {
    await aStation();
    await repo().createOCPPMessage(TENANT_A, STATION, aFrame());

    await expect(
      repo().hasMessageWithPayloadRequestId(
        TENANT_A,
        'ghost',
        OCPP_CallAction.GetDisplayMessages,
        42,
      ),
    ).resolves.toBe(false);
  });

  it('does not cross tenants', async () => {
    await aStation();
    await repo().createOCPPMessage(TENANT_A, STATION, aFrame());

    await expect(
      repo().hasMessageWithPayloadRequestId(
        TENANT_B,
        STATION,
        OCPP_CallAction.GetDisplayMessages,
        42,
      ),
    ).resolves.toBe(false);
  });
});
