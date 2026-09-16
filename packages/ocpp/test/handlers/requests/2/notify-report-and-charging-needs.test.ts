// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type OcppRequest,
  type OCPP2_common_types,
  type OCPP2_request_types,
  EnergyTransferModeEnum,
  ErrorCode,
  EventGroup,
  MessageOrigin,
  MessageState,
  NotifyEVChargingNeedsStatusEnum,
  OCPP2_0_1,
  OCPP_CallAction,
  SetVariableStatusEnum,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, Message, OcppError } from '@citrineos/base';
import {
  NotifyEVChargingNeedsRequestOcpp2Handler,
  NotifyReportRequestOcpp2Handler,
} from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender, mockDeps } from '@test/test-container.js';
import { aSystemConfig } from '@test/providers/system-config.js';

const STATION_ID = 'station-001';
const REQUEST_ID = 77;
const GENERATED_AT = '2026-01-15T10:00:00.000Z';
const EVSE_ID = 2;
const MAX_CACHING_SECONDS = 123;
const IDENTIFIER = `${DEFAULT_TENANT_ID}:${STATION_ID}`;

function aMessage<T extends OcppRequest>(
  action: OCPP_CallAction,
  eventGroup: EventGroup,
  payload: T,
): Message<T> {
  return new Message(
    MessageOrigin.ChargingStation,
    eventGroup,
    action,
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

describe('NotifyReportRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  let handler: NotifyReportRequestOcpp2Handler;
  let deviceModelRepository: {
    createOrUpdateDeviceModelByStationId: ReturnType<typeof vi.fn>;
    updateResultByStationId: ReturnType<typeof vi.fn>;
  };
  let cache: { set: ReturnType<typeof vi.fn> };
  let ocppSender: ReturnType<typeof makeMockOcppSender>;

  function aNotifyReportMessage(payload: OCPP2_0_1.NotifyReportRequest) {
    return aMessage(OCPP_CallAction.NotifyReport, EventGroup.Reporting, payload);
  }

  function aReportData(): OCPP2_0_1.ReportDataType {
    return {
      component: { name: 'ChargingStation' },
      variable: { name: 'AvailabilityState' },
      variableAttribute: [
        {
          type: OCPP2_0_1.AttributeEnumType.Actual,
          value: 'Available',
          mutability: OCPP2_0_1.MutabilityEnumType.ReadOnly,
        },
      ],
    };
  }

  // Row shape createOrUpdateDeviceModelByStationId resolves with; reload is a
  // sequelize instance method the handler awaits before reading component/variable.
  function anAttributeRow() {
    return {
      type: 'Actual',
      component: { name: 'ChargingStation' },
      variable: { name: 'AvailabilityState' },
      reload: vi.fn().mockResolvedValue(undefined),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    deviceModelRepository = {
      createOrUpdateDeviceModelByStationId: vi.fn().mockResolvedValue([]),
      updateResultByStationId: vi.fn().mockResolvedValue(undefined),
    };
    cache = { set: vi.fn().mockResolvedValue(true) };
    ocppSender = makeMockOcppSender();

    handler = new NotifyReportRequestOcpp2Handler(
      mockDeps<typeof NotifyReportRequestOcpp2Handler>({
        logger,
        ocppSender,
        cache,
        config: aSystemConfig({ timeouts: { maxCachingSeconds: MAX_CACHING_SECONDS } }),
        deviceModelRepository,
      }),
    );
  });

  it('persists each report entry, records an Accepted set-result, and acknowledges with an empty response', async () => {
    const reportData = aReportData();
    const row = anAttributeRow();
    deviceModelRepository.createOrUpdateDeviceModelByStationId.mockResolvedValue([row]);

    const message = aNotifyReportMessage({
      requestId: REQUEST_ID,
      generatedAt: GENERATED_AT,
      seqNo: 0,
      reportData: [reportData],
    });

    await handler.handle(message);

    expect(deviceModelRepository.createOrUpdateDeviceModelByStationId).toHaveBeenCalledOnce();
    expect(deviceModelRepository.createOrUpdateDeviceModelByStationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      reportData,
      STATION_ID,
      GENERATED_AT,
    );
    expect(row.reload).toHaveBeenCalledOnce();
    expect(deviceModelRepository.updateResultByStationId).toHaveBeenCalledOnce();
    expect(deviceModelRepository.updateResultByStationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      {
        attributeType: 'Actual',
        attributeStatus: SetVariableStatusEnum.Accepted,
        attributeStatusInfo: { reasonCode: OCPP_CallAction.NotifyReport },
        component: row.component,
        variable: row.variable,
      },
      STATION_ID,
      GENERATED_AT,
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({});
  });

  it('marks the report complete in the cache when tbc is omitted', async () => {
    await handler.handle(
      aNotifyReportMessage({
        requestId: REQUEST_ID,
        generatedAt: GENERATED_AT,
        seqNo: 0,
      }),
    );

    expect(deviceModelRepository.createOrUpdateDeviceModelByStationId).not.toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledOnce();
    // no expiry argument: the complete marker is not time-bounded
    expect(cache.set).toHaveBeenCalledWith(
      REQUEST_ID.toString(),
      NotifyReportRequestOcpp2Handler.GET_BASE_REPORT_COMPLETE_CACHE_VALUE,
      IDENTIFIER,
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({});
  });

  it('extends the ongoing cache marker with maxCachingSeconds when tbc is true', async () => {
    await handler.handle(
      aNotifyReportMessage({
        requestId: REQUEST_ID,
        generatedAt: GENERATED_AT,
        seqNo: 1,
        tbc: true,
      }),
    );

    expect(cache.set).toHaveBeenCalledOnce();
    expect(cache.set).toHaveBeenCalledWith(
      REQUEST_ID.toString(),
      NotifyReportRequestOcpp2Handler.GET_BASE_REPORT_ONGOING_CACHE_VALUE,
      IDENTIFIER,
      MAX_CACHING_SECONDS,
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
  });

  it('answers a foreign-key violation with a PropertyConstraintViolation call error and skips the cache', async () => {
    const fkError = new Error('insert or update violates foreign key constraint');
    fkError.name = 'SequelizeForeignKeyConstraintError';
    deviceModelRepository.createOrUpdateDeviceModelByStationId.mockRejectedValue(fkError);

    await handler.handle(
      aNotifyReportMessage({
        requestId: REQUEST_ID,
        generatedAt: GENERATED_AT,
        seqNo: 0,
        reportData: [aReportData()],
      }),
    );

    expect(ocppSender.sendCallErrorWithMessage).toHaveBeenCalledOnce();
    const sentError = ocppSender.sendCallErrorWithMessage.mock.calls[0][1] as OcppError;
    expect(sentError).toBeInstanceOf(OcppError);
    expect(sentError.messageId).toBe('corr-001');
    expect(sentError.errorCode).toBe(ErrorCode.PropertyConstraintViolation);
    expect(sentError.message).toBe('Referenced entity does not exist.');
    expect(ocppSender.sendCallResultWithMessage).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('rethrows a non-foreign-key persistence error without sending anything', async () => {
    deviceModelRepository.createOrUpdateDeviceModelByStationId.mockRejectedValue(
      new Error('db down'),
    );

    await expect(
      handler.handle(
        aNotifyReportMessage({
          requestId: REQUEST_ID,
          generatedAt: GENERATED_AT,
          seqNo: 0,
          reportData: [aReportData()],
        }),
      ),
    ).rejects.toThrow('db down');

    expect(ocppSender.sendCallResultWithMessage).not.toHaveBeenCalled();
    expect(ocppSender.sendCallErrorWithMessage).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });
});

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

  const activeTransaction = { id: 55, transactionId: 'tx-55' };

  const chargingProfile = {
    id: 7,
    stackLevel: 0,
    chargingProfilePurpose: 'TxProfile',
    chargingProfileKind: 'Absolute',
    chargingSchedule: [
      {
        id: 1,
        chargingRateUnit: 'W',
        chargingSchedulePeriod: [{ startPeriod: 0, limit: 11000 }],
      },
    ],
  } as unknown as OCPP2_common_types.ChargingProfileType;

  function aChargingNeedsMessage(chargingNeeds: OCPP2_common_types.ChargingNeedsType) {
    return aMessage(OCPP_CallAction.NotifyEVChargingNeeds, EventGroup.SmartCharging, {
      evseId: EVSE_ID,
      chargingNeeds,
    } as OCPP2_request_types.NotifyEVChargingNeedsRequest);
  }

  function dcNeeds(): OCPP2_common_types.ChargingNeedsType {
    return {
      requestedEnergyTransfer: EnergyTransferModeEnum.DC,
      dcChargingParameters: { evMaxCurrent: 200, evMaxVoltage: 400 },
    } as OCPP2_common_types.ChargingNeedsType;
  }

  function acNeeds(): OCPP2_common_types.ChargingNeedsType {
    return {
      requestedEnergyTransfer: EnergyTransferModeEnum.AC_three_phase,
      acChargingParameters: {
        energyAmount: 20000,
        evMinCurrent: 6,
        evMaxCurrent: 32,
        evMaxVoltage: 400,
      },
    } as OCPP2_common_types.ChargingNeedsType;
  }

  beforeEach(() => {
    vi.clearAllMocks();

    transactionEventRepository = {
      getActiveTransactionByStationIdAndEvseId: vi.fn().mockResolvedValue(activeTransaction),
    };
    chargingProfileRepository = {
      createChargingNeeds: vi.fn().mockResolvedValue({ id: 3 }),
      createOrUpdateChargingProfile: vi.fn().mockResolvedValue({ databaseId: 9 }),
    };
    smartChargingService = { calculateChargingProfile: vi.fn().mockResolvedValue(chargingProfile) };
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

  it('rejects when no active transaction exists on the evse', async () => {
    transactionEventRepository.getActiveTransactionByStationIdAndEvseId.mockResolvedValue(
      undefined,
    );

    await handler.handle(aChargingNeedsMessage(dcNeeds()));

    expect(
      transactionEventRepository.getActiveTransactionByStationIdAndEvseId,
    ).toHaveBeenCalledOnce();
    expect(
      transactionEventRepository.getActiveTransactionByStationIdAndEvseId,
    ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION_ID, EVSE_ID);
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({
      status: NotifyEVChargingNeedsStatusEnum.Rejected,
    });
    expect(smartChargingService.calculateChargingProfile).not.toHaveBeenCalled();
    expect(chargingProfileRepository.createChargingNeeds).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('rejects when the charging needs carry neither AC nor DC parameters', async () => {
    await handler.handle(
      aChargingNeedsMessage({
        requestedEnergyTransfer: EnergyTransferModeEnum.DC,
      } as OCPP2_common_types.ChargingNeedsType),
    );

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({
      status: NotifyEVChargingNeedsStatusEnum.Rejected,
    });
    expect(smartChargingService.calculateChargingProfile).not.toHaveBeenCalled();
  });

  it('rejects when the parameter type contradicts requestedEnergyTransfer (K17.FR.06)', async () => {
    await handler.handle(
      aChargingNeedsMessage({
        requestedEnergyTransfer: EnergyTransferModeEnum.AC_three_phase,
        dcChargingParameters: { evMaxCurrent: 200, evMaxVoltage: 400 },
      } as OCPP2_common_types.ChargingNeedsType),
    );

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({
      status: NotifyEVChargingNeedsStatusEnum.Rejected,
    });
    expect(smartChargingService.calculateChargingProfile).not.toHaveBeenCalled();
    expect(chargingProfileRepository.createChargingNeeds).not.toHaveBeenCalled();
  });

  it('rejects and stores nothing when the smart charging calculation fails', async () => {
    smartChargingService.calculateChargingProfile.mockRejectedValue(
      new Error('grid limit unknown'),
    );

    await handler.handle(aChargingNeedsMessage(dcNeeds()));

    expect(smartChargingService.calculateChargingProfile).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({
      status: NotifyEVChargingNeedsStatusEnum.Rejected,
    });
    expect(chargingProfileRepository.createChargingNeeds).not.toHaveBeenCalled();
    expect(chargingProfileRepository.createOrUpdateChargingProfile).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('accepts DC needs, stores needs and profile, and pushes SetChargingProfile to the station', async () => {
    const message = aChargingNeedsMessage(dcNeeds());

    await handler.handle(message);

    expect(smartChargingService.calculateChargingProfile).toHaveBeenCalledOnce();
    expect(smartChargingService.calculateChargingProfile).toHaveBeenCalledWith(
      message.payload,
      activeTransaction,
      DEFAULT_TENANT_ID,
      STATION_ID,
    );
    expect(chargingProfileRepository.createChargingNeeds).toHaveBeenCalledOnce();
    expect(chargingProfileRepository.createChargingNeeds).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      message.payload,
      STATION_ID,
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({
      status: NotifyEVChargingNeedsStatusEnum.Accepted,
    });
    // profile is stored in its mapped (native enum) form
    expect(chargingProfileRepository.createOrUpdateChargingProfile).toHaveBeenCalledOnce();
    expect(chargingProfileRepository.createOrUpdateChargingProfile).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      {
        id: 7,
        stackLevel: 0,
        chargingProfilePurpose: 'TxProfile',
        chargingProfileKind: 'Absolute',
        chargingSchedule: [
          {
            id: 1,
            chargingRateUnit: 'W',
            chargingSchedulePeriod: [{ startPeriod: 0, limit: 11000 }],
          },
        ],
      },
      STATION_ID,
      EVSE_ID,
    );
    expect(ocppSender.sendCall).toHaveBeenCalledOnce();
    expect(ocppSender.sendCall).toHaveBeenCalledWith({
      ocppConnectionName: STATION_ID,
      tenantId: DEFAULT_TENANT_ID,
      protocol: 'ocpp2.0.1',
      action: OCPP_CallAction.SetChargingProfile,
      eventGroup: EventGroup.SmartCharging,
      payload: { evseId: EVSE_ID, chargingProfile },
    });
  });

  it('accepts AC needs when acChargingParameters match a non-DC transfer mode', async () => {
    await handler.handle(aChargingNeedsMessage(acNeeds()));

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({
      status: NotifyEVChargingNeedsStatusEnum.Accepted,
    });
    expect(ocppSender.sendCall).toHaveBeenCalledOnce();
  });
});
