// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type OcppRequest,
  type OCPP2_request_types,
  ChargingProfileKindEnum,
  ChargingProfilePurposeEnum,
  EventGroup,
  GenericStatusEnum,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, Message } from '@citrineos/base';
import { NotifyEVChargingScheduleRequestOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender, mockDeps } from '@test/test-container.js';

const STATION_ID = 'station-001';
const EVSE_ID = 2;
const TRANSACTION = { id: 7, transactionId: 'tx-123' };
const SCHEDULE_ID = 11;
const PROFILE_ID = 22;
const STACK_LEVEL = 3;

function aNotifyEVChargingScheduleMessage<T extends OcppRequest>(payload: T): Message<T> {
  return new Message(
    MessageOrigin.ChargingStation,
    EventGroup.SmartCharging,
    OCPP_CallAction.NotifyEVChargingSchedule,
    MessageState.Request,
    {
      correlationId: 'corr-001',
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION_ID,
      timestamp: new Date().toISOString(),
    },
    payload,
    'ocpp2.0.1',
  );
}

// Fresh object per test - the handler mutates chargingSchedule in place.
function aNotifyEVChargingScheduleRequest(
  startSchedule?: string,
): OCPP2_request_types.NotifyEVChargingScheduleRequest {
  return {
    timeBase: '2026-05-01T08:00:00.000Z',
    evseId: EVSE_ID,
    chargingSchedule: {
      id: 0,
      chargingRateUnit: 'W',
      chargingSchedulePeriod: [{ startPeriod: 0, limit: 11000 }],
      ...(startSchedule ? { startSchedule } : {}),
    },
  } as OCPP2_request_types.NotifyEVChargingScheduleRequest;
}

describe('NotifyEVChargingScheduleRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  let handler: NotifyEVChargingScheduleRequestOcpp2Handler;
  let transactionEventRepository: {
    getActiveTransactionByStationIdAndEvseId: ReturnType<typeof vi.fn>;
  };
  let chargingProfileRepository: {
    getNextChargingScheduleId: ReturnType<typeof vi.fn>;
    getNextChargingProfileId: ReturnType<typeof vi.fn>;
    getNextStackLevel: ReturnType<typeof vi.fn>;
  };
  let smartChargingService: { checkLimitsOfChargingSchedule: ReturnType<typeof vi.fn> };
  let ocppSender: ReturnType<typeof makeMockOcppSender>;

  beforeEach(() => {
    vi.clearAllMocks();

    transactionEventRepository = {
      getActiveTransactionByStationIdAndEvseId: vi.fn().mockResolvedValue(TRANSACTION),
    };
    chargingProfileRepository = {
      getNextChargingScheduleId: vi.fn().mockResolvedValue(SCHEDULE_ID),
      getNextChargingProfileId: vi.fn().mockResolvedValue(PROFILE_ID),
      getNextStackLevel: vi.fn().mockResolvedValue(STACK_LEVEL),
    };
    smartChargingService = { checkLimitsOfChargingSchedule: vi.fn().mockResolvedValue(undefined) };
    ocppSender = makeMockOcppSender();

    handler = new NotifyEVChargingScheduleRequestOcpp2Handler(
      mockDeps<typeof NotifyEVChargingScheduleRequestOcpp2Handler>({
        logger,
        ocppSender,
        transactionEventRepository,
        chargingProfileRepository,
        smartChargingService,
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('acknowledges with Accepted before looking up the transaction', async () => {
    const message = aNotifyEVChargingScheduleMessage(aNotifyEVChargingScheduleRequest());

    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {
      status: GenericStatusEnum.Accepted,
    });
    expect(ocppSender.sendCallResultWithMessage.mock.invocationCallOrder[0]).toBeLessThan(
      transactionEventRepository.getActiveTransactionByStationIdAndEvseId.mock
        .invocationCallOrder[0],
    );
  });

  it('checks the schedule limits against the active transaction on the evse', async () => {
    const message = aNotifyEVChargingScheduleMessage(aNotifyEVChargingScheduleRequest());

    await handler.handle(message);

    expect(
      transactionEventRepository.getActiveTransactionByStationIdAndEvseId,
    ).toHaveBeenCalledOnce();
    expect(
      transactionEventRepository.getActiveTransactionByStationIdAndEvseId,
    ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION_ID, EVSE_ID);
    expect(smartChargingService.checkLimitsOfChargingSchedule).toHaveBeenCalledOnce();
    expect(smartChargingService.checkLimitsOfChargingSchedule).toHaveBeenCalledWith(
      message.payload,
      DEFAULT_TENANT_ID,
      STATION_ID,
      TRANSACTION,
    );
  });

  it('stops after the ack when no transaction is active on the evse', async () => {
    transactionEventRepository.getActiveTransactionByStationIdAndEvseId.mockResolvedValue(
      undefined,
    );

    await handler.handle(aNotifyEVChargingScheduleMessage(aNotifyEVChargingScheduleRequest()));

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      `No active transaction on station ${STATION_ID} evse ${EVSE_ID}`,
    );
    expect(smartChargingService.checkLimitsOfChargingSchedule).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('issues no SetChargingProfile when the schedule is within limits', async () => {
    await handler.handle(aNotifyEVChargingScheduleMessage(aNotifyEVChargingScheduleRequest()));

    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(chargingProfileRepository.getNextChargingScheduleId).not.toHaveBeenCalled();
    expect(chargingProfileRepository.getNextChargingProfileId).not.toHaveBeenCalled();
  });

  it('sends a TxProfile SetChargingProfile call when the limit check throws', async () => {
    smartChargingService.checkLimitsOfChargingSchedule.mockRejectedValue(
      new Error('exceeds composite schedule'),
    );

    await handler.handle(
      aNotifyEVChargingScheduleMessage(
        aNotifyEVChargingScheduleRequest('2026-05-01T08:00:00.000Z'),
      ),
    );

    expect(chargingProfileRepository.getNextChargingScheduleId).toHaveBeenCalledOnce();
    expect(chargingProfileRepository.getNextChargingScheduleId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION_ID,
    );
    expect(chargingProfileRepository.getNextStackLevel).toHaveBeenCalledOnce();
    expect(chargingProfileRepository.getNextStackLevel).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION_ID,
      TRANSACTION.id,
      ChargingProfilePurposeEnum.TxProfile,
    );
    expect(ocppSender.sendCall).toHaveBeenCalledOnce();
    expect(ocppSender.sendCall).toHaveBeenCalledWith({
      ocppConnectionName: STATION_ID,
      tenantId: DEFAULT_TENANT_ID,
      protocol: 'ocpp2.0.1',
      action: OCPP_CallAction.SetChargingProfile,
      eventGroup: EventGroup.SmartCharging,
      payload: {
        evseId: EVSE_ID,
        chargingProfile: {
          id: PROFILE_ID,
          stackLevel: STACK_LEVEL,
          chargingProfilePurpose: ChargingProfilePurposeEnum.TxProfile,
          chargingProfileKind: ChargingProfileKindEnum.Absolute,
          chargingSchedule: [
            {
              id: SCHEDULE_ID,
              chargingRateUnit: 'W',
              chargingSchedulePeriod: [{ startPeriod: 0, limit: 11000 }],
              startSchedule: '2026-05-01T08:00:00.000Z',
            },
          ],
          transactionId: TRANSACTION.transactionId,
        },
      },
    });
  });

  it('stamps the current time as startSchedule when the EV schedule has none', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T04:05:06.000Z'));
    smartChargingService.checkLimitsOfChargingSchedule.mockRejectedValue(new Error('over limit'));

    await handler.handle(aNotifyEVChargingScheduleMessage(aNotifyEVChargingScheduleRequest()));

    expect(ocppSender.sendCall).toHaveBeenCalledOnce();
    const sentProfile = ocppSender.sendCall.mock.calls[0][0].payload.chargingProfile;
    expect(sentProfile.chargingSchedule[0].startSchedule).toBe('2026-02-03T04:05:06.000Z');
  });
});
