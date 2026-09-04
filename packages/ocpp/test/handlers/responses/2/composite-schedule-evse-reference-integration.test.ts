// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, type IMessage } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  type OcppResponse,
  OCPPVersion,
  type SystemConfig,
} from '@citrineos/types';
import {
  ChargingStation,
  DefaultSequelizeInstance,
  Evse,
  EvseType,
  SequelizeChargingProfileRepository,
  Tenant,
} from '@citrineos/dal';
import { CompositeSchedule } from '@dal/db/sequelize/index.js';
import { GetCompositeScheduleResponseOcpp201Handler } from '@handlers/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const STATION = 'CS-COMPOSITE-1';
const OTHER_STATION = 'CS-COMPOSITE-2';
const WHOLE_STATION = 0;
const UNCOMMISSIONED_EVSE = 6;

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let config: SystemConfig;

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:16-3.4-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'citrineos_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 2))
    .start();

  config = {
    database: {
      host: pgContainer.getHost(),
      port: pgContainer.getMappedPort(5432),
      database: 'citrineos_test',
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      sync: false,
      alter: false,
      force: false,
      maxRetries: 1,
      retryDelay: 100,
    },
  } as unknown as SystemConfig;

  sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

let nextEvseNumber = 1;

async function aStation(ocppConnectionName: string) {
  await ChargingStation.create({
    ocppConnectionName,
    isOnline: true,
    tenantId: DEFAULT_TENANT_ID,
  } as never);
}

/** Adds one commissioned EVSE to a station and returns its database id. */
async function anEvseOn(ocppConnectionName: string, ocppEvseNumber: number): Promise<number> {
  const evseTypeNumber = nextEvseNumber++;
  await EvseType.create({
    tenantId: DEFAULT_TENANT_ID,
    id: evseTypeNumber,
    connectorId: null,
  } as never);
  const evse = await Evse.create({
    tenantId: DEFAULT_TENANT_ID,
    ocppConnectionName,
    evseTypeId: ocppEvseNumber,
  } as never);
  return (evse as unknown as { id: number }).id;
}

function aCompositeScheduleResponse(evseId: number): IMessage<OcppResponse> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-1',
      timestamp: new Date().toISOString(),
    },
    payload: {
      status: 'Accepted',
      schedule: {
        evseId,
        duration: 3600,
        scheduleStart: new Date().toISOString(),
        chargingRateUnit: 'W',
        chargingSchedulePeriod: [{ startPeriod: 0, limit: 22000 }],
      },
    },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.SmartCharging,
    action: OCPP_CallAction.GetCompositeSchedule,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<OcppResponse>;
}

describe('A composite schedule reported for a station EVSE number', () => {
  const { container } = createTestContainer();

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    nextEvseNumber = 1;

    await aStation(OTHER_STATION);
    await anEvseOn(OTHER_STATION, 1);
    await anEvseOn(OTHER_STATION, 2);

    await aStation(STATION);
    await anEvseOn(STATION, 1);
  });

  function aHandler() {
    return getTestInstance(container, GetCompositeScheduleResponseOcpp201Handler, {
      chargingProfileRepository: new SequelizeChargingProfileRepository({
        config,
        logger: undefined,
        sequelizeInstance,
      } as never),
    });
  }

  it('stores the schedule for the whole charging station without an EVSE', async () => {
    await aHandler().handle(aCompositeScheduleResponse(WHOLE_STATION) as never);

    const stored = await CompositeSchedule.findAll();
    expect(stored).toHaveLength(1);
    expect(stored[0].evseId).toBeNull();
  });

  it('associates the schedule with the EVSE the station named', async () => {
    const ownEvse = await Evse.findOne({
      where: { ocppConnectionName: STATION, evseTypeId: 1 },
    });

    await aHandler().handle(aCompositeScheduleResponse(1) as never);

    const stored = await CompositeSchedule.findAll();
    expect(stored).toHaveLength(1);
    expect(stored[0].evseId).toBe(ownEvse!.id);
  });

  it('does not associate the schedule with another station EVSE carrying that number', async () => {
    const ownEvse = await Evse.findOne({
      where: { ocppConnectionName: STATION, evseTypeId: 1 },
    });
    const neighbour = await Evse.findOne({
      where: { ocppConnectionName: OTHER_STATION, evseTypeId: 1 },
    });

    await aHandler().handle(aCompositeScheduleResponse(1) as never);

    const stored = await CompositeSchedule.findAll();
    expect(stored[0].evseId).toBe(ownEvse!.id);
    expect(stored[0].evseId).not.toBe(neighbour!.id);
  });

  it('stores the schedule without an EVSE when the station names one it has not reported', async () => {
    await aHandler().handle(aCompositeScheduleResponse(UNCOMMISSIONED_EVSE) as never);

    const stored = await CompositeSchedule.findAll();
    expect(stored).toHaveLength(1);
    expect(stored[0].evseId).toBeNull();
  });
});
