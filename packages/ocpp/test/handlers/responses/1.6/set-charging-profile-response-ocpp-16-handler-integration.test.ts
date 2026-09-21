// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, type IMessage } from '@citrineos/base';
import {
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
  SequelizeChargingProfileRepository,
} from '@citrineos/dal';
import { Tenant } from '@dal/db/sequelize/index.js';
import { SetChargingProfileResponseOcpp16Handler } from '@handlers/index.js';
import { createTestContainer } from '@test/test-container.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'CS-16-SET';
const OTHER_STATION = 'CS-16-SET-OTHER';
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

function anAcceptedSetResponse(
  ocppConnectionName: string,
): IMessage<OCPP1_6.SetChargingProfileResponse> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName,
      correlationId: 'corr-set-1',
      timestamp: new Date().toISOString(),
    },
    payload: { status: OCPP1_6.SetChargingProfileResponseStatus.Accepted },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.SmartCharging,
    action: OCPP_CallAction.SetChargingProfile,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<OCPP1_6.SetChargingProfileResponse>;
}

async function activeProfileIds(ocppConnectionName: string = STATION): Promise<number[]> {
  const profiles = await ChargingProfile.findAll({
    where: { ocppConnectionName, isActive: true },
  });
  return profiles.map((profile) => profile.id).sort((a, b) => a - b);
}

describe('An accepted OCPP 1.6 SetChargingProfile', () => {
  const { logger } = createTestContainer();

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
  });

  async function setOn(
    ocppConnectionName: string,
    connectorId: number,
    chargingProfileId: number,
    chargingProfilePurpose: OCPP1_6.SetChargingProfileRequestChargingProfilePurpose,
    stackLevel: number,
  ) {
    const request: OCPP1_6.SetChargingProfileRequest = {
      connectorId,
      csChargingProfiles: {
        chargingProfileId,
        stackLevel,
        chargingProfilePurpose,
        chargingProfileKind: OCPP1_6.SetChargingProfileRequestChargingProfileKind.Absolute,
        chargingSchedule: {
          chargingRateUnit: OCPP1_6.SetChargingProfileRequestChargingRateUnit.A,
          chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
        },
      },
    };
    const handler = new SetChargingProfileResponseOcpp16Handler({
      logger,
      chargingProfileRepository: new SequelizeChargingProfileRepository({
        config,
        logger: undefined,
        sequelizeInstance,
      } as never),
      ocppMessageRepository: {
        readOnlyOneByQuery: vi.fn().mockResolvedValue({ payload: request }),
      } as unknown as IOCPPMessageRepository,
    } as never);
    await handler.handle(anAcceptedSetResponse(ocppConnectionName));
  }

  it('retires the profile the station replaced with one of the same stackLevel and purpose', async () => {
    await setOn(STATION, 1, 10, TxDefaultProfile, 0);

    await setOn(STATION, 1, 11, TxDefaultProfile, 0);

    expect(await activeProfileIds()).toEqual([11]);
  });

  it('keeps a profile at another stackLevel active', async () => {
    await setOn(STATION, 1, 10, TxDefaultProfile, 0);

    await setOn(STATION, 1, 11, TxDefaultProfile, 1);

    expect(await activeProfileIds()).toEqual([10, 11]);
  });

  it('keeps a profile with another purpose active', async () => {
    await setOn(STATION, 0, 10, ChargePointMaxProfile, 0);

    await setOn(STATION, 0, 11, TxDefaultProfile, 0);

    expect(await activeProfileIds()).toEqual([10, 11]);
  });

  it('keeps a profile on another connector active', async () => {
    await setOn(STATION, 1, 10, TxDefaultProfile, 0);

    await setOn(STATION, 2, 11, TxDefaultProfile, 0);

    expect(await activeProfileIds()).toEqual([10, 11]);
  });

  it('keeps the profile active when the station accepts the same id again', async () => {
    await setOn(STATION, 1, 10, TxDefaultProfile, 0);

    await setOn(STATION, 1, 10, TxDefaultProfile, 0);

    expect(await activeProfileIds()).toEqual([10]);
  });

  it('leaves the same combination on another station active', async () => {
    await setOn(OTHER_STATION, 1, 10, TxDefaultProfile, 0);

    await setOn(STATION, 1, 11, TxDefaultProfile, 0);

    expect(await activeProfileIds(OTHER_STATION)).toEqual([10]);
  });
});
