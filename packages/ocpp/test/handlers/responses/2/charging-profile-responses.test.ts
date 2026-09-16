// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppResponse,
  ChargingLimitSourceEnum,
  ChargingProfileStatusEnum,
  ChargingStationSequenceTypeEnum,
  ClearChargingProfileStatusEnum,
  EventGroup,
  GenericStatusEnum,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
  TariffSetStatusEnum,
} from '@citrineos/types';
import type {
  IChargingProfileRepository,
  IOCPPMessageRepository,
  ITariffRepository,
} from '@citrineos/dal';
import {
  ClearChargingProfileResponseOcpp2Handler,
  GetChargingProfilesResponseOcpp2Handler,
  GetCompositeScheduleResponseOcpp201Handler,
  SetChargingProfileResponseOcpp2Handler,
  SetDefaultTariffResponseOcpp21Handler,
} from '@handlers/index.js';
import { createTestContainer, getTestInstance, makeMockOcppSender } from '@test/test-container.js';
import type { IdGenerator } from '@util/index.js';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';
const CORRELATION_ID = 'corr-001';
const REQUEST_ID = 77;

function makeMessage<T extends OcppResponse>(
  action: OCPP_CallAction,
  protocol: OCPPVersion,
  payload: T,
): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: CORRELATION_ID,
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.SmartCharging,
    action,
    state: MessageState.Response,
    protocol,
  } as unknown as IMessage<T>;
}

function makeChargingProfileRepository(): Mocked<IChargingProfileRepository> {
  return {
    updateAllByQuery: vi.fn().mockResolvedValue([]),
    createCompositeSchedule: vi.fn().mockResolvedValue({ databaseId: 1 }),
  } as unknown as Mocked<IChargingProfileRepository>;
}

function makeIdGenerator(): Mocked<IdGenerator> {
  return {
    generateRequestId: vi.fn().mockResolvedValue(REQUEST_ID),
  } as unknown as Mocked<IdGenerator>;
}

describe('ClearChargingProfileResponseOcpp2Handler', () => {
  const { container, logger } = createTestContainer();
  let chargingProfileRepository: Mocked<IChargingProfileRepository>;
  let idGenerator: Mocked<IdGenerator>;
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let handler: ClearChargingProfileResponseOcpp2Handler;

  beforeEach(() => {
    chargingProfileRepository = makeChargingProfileRepository();
    idGenerator = makeIdGenerator();
    ocppSender = makeMockOcppSender();
    handler = getTestInstance(container, ClearChargingProfileResponseOcpp2Handler, {
      ocppSender,
      chargingProfileRepository,
      idGenerator,
    });
  });

  it('deactivates active profiles for the station when the clear was accepted', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.ClearChargingProfile, OCPPVersion.OCPP2_0_1, {
        status: ClearChargingProfileStatusEnum.Accepted,
      } as never),
    );

    expect(chargingProfileRepository.updateAllByQuery).toHaveBeenCalledTimes(1);
    expect(chargingProfileRepository.updateAllByQuery).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      { isActive: false },
      {
        where: {
          tenantId: DEFAULT_TENANT_ID,
          ocppConnectionName: STATION,
          isActive: true,
        },
        returning: false,
      },
    );
  });

  it('requests fresh profiles across all four limit sources after a successful clear', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.ClearChargingProfile, OCPPVersion.OCPP2_0_1, {
        status: ClearChargingProfileStatusEnum.Accepted,
      } as never),
    );

    expect(idGenerator.generateRequestId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      ChargingStationSequenceTypeEnum.getChargingProfiles,
    );
    expect(ocppSender.sendCall).toHaveBeenCalledTimes(1);
    expect(ocppSender.sendCall).toHaveBeenCalledWith({
      ocppConnectionName: STATION,
      tenantId: DEFAULT_TENANT_ID,
      protocol: OCPPVersion.OCPP2_0_1,
      action: OCPP_CallAction.GetChargingProfiles,
      eventGroup: EventGroup.SmartCharging,
      payload: {
        requestId: REQUEST_ID,
        chargingProfile: {
          chargingLimitSource: [
            ChargingLimitSourceEnum.CSO,
            ChargingLimitSourceEnum.EMS,
            ChargingLimitSourceEnum.SO,
            ChargingLimitSourceEnum.Other,
          ],
        },
      },
    });
  });

  it('neither writes nor sends when the station reports Unknown', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.ClearChargingProfile, OCPPVersion.OCPP2_0_1, {
        status: ClearChargingProfileStatusEnum.Unknown,
      } as never),
    );

    expect(chargingProfileRepository.updateAllByQuery).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      `Failed to clear charging profile: ${JSON.stringify({ status: ClearChargingProfileStatusEnum.Unknown })}`,
    );
  });
});

describe('SetChargingProfileResponseOcpp2Handler', () => {
  const { container, logger } = createTestContainer();
  let chargingProfileRepository: Mocked<IChargingProfileRepository>;
  let idGenerator: Mocked<IdGenerator>;
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let handler: SetChargingProfileResponseOcpp2Handler;

  beforeEach(() => {
    chargingProfileRepository = makeChargingProfileRepository();
    idGenerator = makeIdGenerator();
    ocppSender = makeMockOcppSender();
    handler = getTestInstance(container, SetChargingProfileResponseOcpp2Handler, {
      ocppSender,
      chargingProfileRepository,
      idGenerator,
    });
  });

  it('deactivates only CSO-sourced active profiles when the profile was accepted', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.SetChargingProfile, OCPPVersion.OCPP2_0_1, {
        status: ChargingProfileStatusEnum.Accepted,
      } as never),
    );

    expect(chargingProfileRepository.updateAllByQuery).toHaveBeenCalledTimes(1);
    expect(chargingProfileRepository.updateAllByQuery).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      { isActive: false },
      {
        where: {
          tenantId: DEFAULT_TENANT_ID,
          ocppConnectionName: STATION,
          isActive: true,
          chargingLimitSource: ChargingLimitSourceEnum.CSO,
        },
        returning: false,
      },
    );
  });

  it('requests fresh profiles restricted to the CSO source after acceptance', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.SetChargingProfile, OCPPVersion.OCPP2_0_1, {
        status: ChargingProfileStatusEnum.Accepted,
      } as never),
    );

    expect(idGenerator.generateRequestId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      ChargingStationSequenceTypeEnum.getChargingProfiles,
    );
    expect(ocppSender.sendCall).toHaveBeenCalledTimes(1);
    expect(ocppSender.sendCall).toHaveBeenCalledWith({
      ocppConnectionName: STATION,
      tenantId: DEFAULT_TENANT_ID,
      protocol: OCPPVersion.OCPP2_0_1,
      action: OCPP_CallAction.GetChargingProfiles,
      eventGroup: EventGroup.SmartCharging,
      payload: {
        requestId: REQUEST_ID,
        chargingProfile: {
          chargingLimitSource: [ChargingLimitSourceEnum.CSO],
        },
      },
    });
  });

  it('neither writes nor sends when the station rejected the profile', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.SetChargingProfile, OCPPVersion.OCPP2_0_1, {
        status: ChargingProfileStatusEnum.Rejected,
      } as never),
    );

    expect(chargingProfileRepository.updateAllByQuery).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      `Failed to set charging profile: ${JSON.stringify({ status: ChargingProfileStatusEnum.Rejected })}`,
    );
  });
});

describe('SetDefaultTariffResponseOcpp21Handler', () => {
  const { container, logger } = createTestContainer();
  let ocppMessageRepository: Mocked<IOCPPMessageRepository>;
  let tariffRepository: Mocked<ITariffRepository>;
  let handler: SetDefaultTariffResponseOcpp21Handler;

  const storedTariffRequest = {
    evseId: 1,
    tariff: {
      tariffId: 'tariff-01',
      currency: 'EUR',
      validFrom: '2026-01-01T00:00:00.000Z',
      description: null,
      energy: { prices: [{ priceKwh: 0.3 }] },
    },
  };

  beforeEach(() => {
    ocppMessageRepository = {
      readOnlyOneByQuery: vi.fn().mockResolvedValue({ payload: storedTariffRequest }),
    } as unknown as Mocked<IOCPPMessageRepository>;
    tariffRepository = {
      upsertTariffByTariffId: vi.fn().mockResolvedValue({ id: 5 }),
    } as unknown as Mocked<ITariffRepository>;
    handler = getTestInstance(container, SetDefaultTariffResponseOcpp21Handler, {
      ocppMessageRepository,
      tariffRepository,
    });
  });

  it('looks up the originating CSMS request by correlation id', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.SetDefaultTariff, OCPPVersion.OCPP2_1, {
        status: TariffSetStatusEnum.Accepted,
      } as never),
    );

    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledTimes(1);
    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
      where: {
        tenantId: DEFAULT_TENANT_ID,
        ocppConnectionName: STATION,
        correlationId: CORRELATION_ID,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
  });

  it('upserts a tariff carried over from the stored request with pricePerKwh forced to 0', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.SetDefaultTariff, OCPPVersion.OCPP2_1, {
        status: TariffSetStatusEnum.Accepted,
      } as never),
    );

    // null description coalesces to undefined; equality below ignores undefined keys
    expect(tariffRepository.upsertTariffByTariffId).toHaveBeenCalledTimes(1);
    expect(tariffRepository.upsertTariffByTariffId).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
      tenantId: DEFAULT_TENANT_ID,
      currency: 'EUR',
      pricePerKwh: 0,
      tariffId: 'tariff-01',
      validFrom: '2026-01-01T00:00:00.000Z',
      energy: { prices: [{ priceKwh: 0.3 }] },
    });
  });

  it('stores nothing when the station did not accept the tariff', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.SetDefaultTariff, OCPPVersion.OCPP2_1, {
        status: TariffSetStatusEnum.Rejected,
      } as never),
    );

    expect(ocppMessageRepository.readOnlyOneByQuery).not.toHaveBeenCalled();
    expect(tariffRepository.upsertTariffByTariffId).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      `SetDefaultTariff rejected for station ${STATION}: ${TariffSetStatusEnum.Rejected}`,
    );
  });

  it('stores nothing when no stored request matches the correlation id', async () => {
    ocppMessageRepository.readOnlyOneByQuery.mockResolvedValue(undefined);

    await handler.handle(
      makeMessage(OCPP_CallAction.SetDefaultTariff, OCPPVersion.OCPP2_1, {
        status: TariffSetStatusEnum.Accepted,
      } as never),
    );

    expect(tariffRepository.upsertTariffByTariffId).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      `No SetDefaultTariffRequest found for correlationId ${CORRELATION_ID} on station ${STATION}`,
    );
  });
});

describe('GetChargingProfilesResponseOcpp2Handler', () => {
  // Log-only stub: no sender, no repositories.
  const { container, logger } = createTestContainer();

  it('resolves and only logs the received message', async () => {
    const handler = getTestInstance(container, GetChargingProfilesResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.GetChargingProfiles, OCPPVersion.OCPP2_0_1, {
      requestId: 3,
      status: 'Accepted',
    } as never);

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expect(logger.info).toHaveBeenCalledWith(
      'Handler for GetChargingProfilesResponse received message:',
      message,
      undefined,
    );
  });
});

describe('GetCompositeScheduleResponseOcpp201Handler', () => {
  const { container, logger } = createTestContainer();
  let chargingProfileRepository: Mocked<IChargingProfileRepository>;
  let handler: GetCompositeScheduleResponseOcpp201Handler;

  const SCHEDULE_START = '2026-08-27T09:00:00.000Z';

  beforeEach(() => {
    chargingProfileRepository = makeChargingProfileRepository();
    handler = getTestInstance(container, GetCompositeScheduleResponseOcpp201Handler, {
      chargingProfileRepository,
    });
  });

  it('persists the mapped composite schedule for the reporting station', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.GetCompositeSchedule, OCPPVersion.OCPP2_0_1, {
        status: GenericStatusEnum.Accepted,
        schedule: {
          evseId: 1,
          duration: 3600,
          scheduleStart: SCHEDULE_START,
          chargingRateUnit: 'W',
          chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
        },
      } as never),
    );

    expect(chargingProfileRepository.createCompositeSchedule).toHaveBeenCalledTimes(1);
    expect(chargingProfileRepository.createCompositeSchedule).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      {
        evseId: 1,
        duration: 3600,
        scheduleStart: SCHEDULE_START,
        chargingRateUnit: 'W',
        chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
      },
      STATION,
    );
  });

  it('stores nothing when the response is accepted but carries no schedule', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.GetCompositeSchedule, OCPPVersion.OCPP2_0_1, {
        status: GenericStatusEnum.Accepted,
        statusInfo: { reasonCode: 'NoSchedule' },
      } as never),
    );

    expect(chargingProfileRepository.createCompositeSchedule).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      `Missing schedule in response: ${GenericStatusEnum.Accepted} ${JSON.stringify({ reasonCode: 'NoSchedule' })}`,
    );
  });

  it('stores nothing when the station rejected the request', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.GetCompositeSchedule, OCPPVersion.OCPP2_0_1, {
        status: GenericStatusEnum.Rejected,
      } as never),
    );

    expect(chargingProfileRepository.createCompositeSchedule).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      `Failed to get composite schedule: ${GenericStatusEnum.Rejected} ${JSON.stringify(undefined)}`,
    );
  });
});
