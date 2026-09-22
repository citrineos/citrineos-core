// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, type IMessage } from '@citrineos/base';
import {
  ChargingLimitSourceEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
  type SystemConfig,
} from '@citrineos/types';
import {
  ChargingProfile,
  DefaultSequelizeInstance,
  type IOCPPMessageRepository,
  OCPP1_6_Mapper,
  SequelizeChargingProfileRepository,
} from '@citrineos/dal';
import { Tenant } from '@dal/db/sequelize/index.js';
import { ClearChargingProfileResponseOcpp16Handler } from '@handlers/index.js';
import { createTestContainer } from '@test/test-container.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'CS-16-CLEAR';
const OTHER_STATION = 'CS-16-CLEAR-OTHER';
const { ChargePointMaxProfile, TxDefaultProfile } =
  OCPP1_6.SetChargingProfileRequestChargingProfilePurpose;

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

function aRepository() {
  return new SequelizeChargingProfileRepository({
    config,
    logger: undefined,
    sequelizeInstance,
  } as never);
}

async function anAcceptedProfile(
  ocppConnectionName: string,
  connectorId: number,
  chargingProfileId: number,
  chargingProfilePurpose: OCPP1_6.SetChargingProfileRequestChargingProfilePurpose,
  stackLevel: number,
) {
  await aRepository().createOrUpdateChargingProfile(
    DEFAULT_TENANT_ID,
    OCPP1_6_Mapper.ChargingProfileMapper.fromSetChargingProfileRequest({
      chargingProfileId,
      stackLevel,
      chargingProfilePurpose,
      chargingProfileKind: OCPP1_6.SetChargingProfileRequestChargingProfileKind.Absolute,
      chargingSchedule: {
        chargingRateUnit: OCPP1_6.SetChargingProfileRequestChargingRateUnit.A,
        chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
      },
    }),
    ocppConnectionName,
    connectorId,
    ChargingLimitSourceEnum.CSO,
    true,
  );
}

function anAcceptedClearResponse(): IMessage<OCPP1_6.ClearChargingProfileResponse> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-clear-1',
      timestamp: new Date().toISOString(),
    },
    payload: { status: OCPP1_6.ClearChargingProfileResponseStatus.Accepted },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.SmartCharging,
    action: OCPP_CallAction.ClearChargingProfile,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<OCPP1_6.ClearChargingProfileResponse>;
}

async function clearedProfileIds(ocppConnectionName: string = STATION): Promise<number[]> {
  const profiles = await ChargingProfile.findAll({
    where: { ocppConnectionName, isActive: false },
  });
  return profiles.map((profile) => profile.id).sort((a, b) => a - b);
}

describe('An accepted OCPP 1.6 ClearChargingProfile', () => {
  const { logger } = createTestContainer();

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);

    await anAcceptedProfile(STATION, 0, 1, ChargePointMaxProfile, 0);
    await anAcceptedProfile(STATION, 1, 2, TxDefaultProfile, 0);
    await anAcceptedProfile(STATION, 0, 3, TxDefaultProfile, 1);
    await anAcceptedProfile(OTHER_STATION, 0, 1, ChargePointMaxProfile, 0);
  });

  async function clear(request: OCPP1_6.ClearChargingProfileRequest | undefined) {
    const handler = new ClearChargingProfileResponseOcpp16Handler({
      logger,
      chargingProfileRepository: aRepository(),
      ocppMessageRepository: {
        readOnlyOneByQuery: vi
          .fn()
          .mockResolvedValue(request === undefined ? undefined : { payload: request }),
      } as unknown as IOCPPMessageRepository,
    } as never);
    await handler.handle(anAcceptedClearResponse());
  }

  it('retires only the profile named by id', async () => {
    await clear({ id: 2 });

    expect(await clearedProfileIds()).toEqual([2]);
  });

  it('ignores the other criteria when an id is given', async () => {
    await clear({ id: 2, connectorId: 0, stackLevel: 1 });

    expect(await clearedProfileIds()).toEqual([2]);
  });

  it('treats connectorId 0 as a criterion for the profiles set on the whole charge point', async () => {
    await clear({ connectorId: 0 });

    expect(await clearedProfileIds()).toEqual([1, 3]);
  });

  it('matches a ChargePointMaxProfile purpose against the profile stored for it', async () => {
    await clear({
      chargingProfilePurpose:
        OCPP1_6.ClearChargingProfileRequestChargingProfilePurpose.ChargePointMaxProfile,
    });

    expect(await clearedProfileIds()).toEqual([1]);
  });

  it('retires only the profiles that match every criterion given', async () => {
    await clear({
      chargingProfilePurpose:
        OCPP1_6.ClearChargingProfileRequestChargingProfilePurpose.TxDefaultProfile,
      stackLevel: 0,
    });

    expect(await clearedProfileIds()).toEqual([2]);
  });

  it('retires every profile on the station when the request carries no criteria', async () => {
    await clear({});

    expect(await clearedProfileIds()).toEqual([1, 2, 3]);
  });

  it('leaves the profiles of another station active', async () => {
    await clear({});

    expect(await clearedProfileIds(OTHER_STATION)).toEqual([]);
  });

  it('leaves the record unchanged when the original request cannot be found', async () => {
    await clear(undefined);

    expect(await clearedProfileIds()).toEqual([]);
  });
});
