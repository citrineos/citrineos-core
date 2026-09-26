// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, Message } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  NotifyEVChargingNeedsStatusEnum,
  OCPP_CallAction,
  type OCPP2_request_types,
} from '@citrineos/types';
import { NotifyEVChargingNeedsRequestOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender, mockDeps } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION_ID = 'station-001';
const EVSE_ID = 1;

function aMessage(
  payload: OCPP2_request_types.NotifyEVChargingNeedsRequest,
  protocol: 'ocpp2.0.1' | 'ocpp2.1' = 'ocpp2.1',
) {
  return new Message(
    MessageOrigin.ChargingStation,
    EventGroup.SmartCharging,
    OCPP_CallAction.NotifyEVChargingNeeds,
    MessageState.Request,
    {
      correlationId: 'corr-001',
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION_ID,
      timestamp: new Date().toISOString(),
    },
    payload,
    protocol,
  );
}

/** What an ISO 15118-20 car asking to discharge actually sends. */
function aBidirectionalRequest(): OCPP2_request_types.NotifyEVChargingNeedsRequest {
  return {
    evseId: EVSE_ID,
    chargingNeeds: {
      requestedEnergyTransfer: 'AC_BPT',
      v2xChargingParameters: {
        evMaxV2XEnergyRequest: 5000,
        evMinV2XEnergyRequest: 0,
      },
    },
  } as unknown as OCPP2_request_types.NotifyEVChargingNeedsRequest;
}

function anAcRequest(): OCPP2_request_types.NotifyEVChargingNeedsRequest {
  return {
    evseId: EVSE_ID,
    chargingNeeds: {
      requestedEnergyTransfer: 'AC_three_phase',
      acChargingParameters: {
        energyAmount: 10000,
        evMinCurrent: 6,
        evMaxCurrent: 32,
        evMaxVoltage: 400,
      },
    },
  } as unknown as OCPP2_request_types.NotifyEVChargingNeedsRequest;
}

const status = (sender: ReturnType<typeof makeMockOcppSender>) =>
  sender.sendCallResultWithMessage.mock.calls.at(-1)?.[1]?.status;

describe('NotifyEVChargingNeedsRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  let handler: NotifyEVChargingNeedsRequestOcpp2Handler;
  let transactionEventRepository: {
    getActiveTransactionByStationIdAndEvseId: ReturnType<typeof vi.fn>;
  };
  let chargingProfileRepository: {
    createChargingNeeds: ReturnType<typeof vi.fn>;
    createOrUpdateChargingProfile: ReturnType<typeof vi.fn>;
  };
  let smartChargingService: { calculateChargingProfile: ReturnType<typeof vi.fn> };
  let ocppSender: ReturnType<typeof makeMockOcppSender>;

  beforeEach(() => {
    vi.clearAllMocks();

    transactionEventRepository = {
      getActiveTransactionByStationIdAndEvseId: vi.fn().mockResolvedValue({ id: 7 }),
    };
    chargingProfileRepository = {
      createChargingNeeds: vi.fn().mockResolvedValue({ id: 1 }),
      createOrUpdateChargingProfile: vi.fn().mockResolvedValue({ id: 2 }),
    };
    smartChargingService = {
      calculateChargingProfile: vi.fn().mockResolvedValue({
        id: 1,
        stackLevel: 0,
        chargingProfilePurpose: 'TxProfile',
        chargingProfileKind: 'Absolute',
        chargingSchedule: [
          { id: 1, chargingRateUnit: 'W', chargingSchedulePeriod: [{ startPeriod: 0, limit: 0 }] },
        ],
      }),
    };
    ocppSender = makeMockOcppSender();

    handler = new NotifyEVChargingNeedsRequestOcpp2Handler(
      mockDeps<typeof NotifyEVChargingNeedsRequestOcpp2Handler>({
        logger,
        ocppSender,
        transactionEventRepository,
        chargingProfileRepository,
        smartChargingService,
      }),
    );
  });

  it('accepts a 2.1 bidirectional need described by v2xChargingParameters', async () => {
    await handler.handle(aMessage(aBidirectionalRequest()));

    expect(status(ocppSender)).toBe(NotifyEVChargingNeedsStatusEnum.Accepted);
    expect(chargingProfileRepository.createChargingNeeds).toHaveBeenCalled();
  });

  it('still accepts a 2.0.1 need described by acChargingParameters', async () => {
    await handler.handle(aMessage(anAcRequest(), 'ocpp2.0.1'));

    expect(status(ocppSender)).toBe(NotifyEVChargingNeedsStatusEnum.Accepted);
    expect(chargingProfileRepository.createChargingNeeds).toHaveBeenCalled();
  });

  it('rejects a need that carries no charging parameters at all', async () => {
    const request = {
      evseId: EVSE_ID,
      chargingNeeds: { requestedEnergyTransfer: 'AC_three_phase' },
    } as unknown as OCPP2_request_types.NotifyEVChargingNeedsRequest;

    await handler.handle(aMessage(request, 'ocpp2.0.1'));

    expect(status(ocppSender)).toBe(NotifyEVChargingNeedsStatusEnum.Rejected);
    expect(chargingProfileRepository.createChargingNeeds).not.toHaveBeenCalled();
  });

  it('rejects when no transaction is running on the EVSE', async () => {
    transactionEventRepository.getActiveTransactionByStationIdAndEvseId.mockResolvedValue(null);

    await handler.handle(aMessage(aBidirectionalRequest()));

    expect(status(ocppSender)).toBe(NotifyEVChargingNeedsStatusEnum.Rejected);
    expect(chargingProfileRepository.createChargingNeeds).not.toHaveBeenCalled();
  });
});
