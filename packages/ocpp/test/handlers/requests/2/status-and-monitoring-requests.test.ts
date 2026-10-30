// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TENANT_ID, type IMessage } from '@citrineos/base';
import {
  type CallAction,
  type OcppRequest,
  type OCPP2_request_types,
  type ReservationUpdateStatusEnumType,
  ConnectorStatusEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
  ReservationUpdateStatusEnum,
} from '@citrineos/types';
import {
  NotifyEventRequestOcpp2Handler,
  NotifyMonitoringReportRequestOcpp2Handler,
  ReportChargingProfilesRequestOcpp2Handler,
  ReservationStatusUpdateRequestOcpp2Handler,
  StatusNotificationRequestOcpp2Handler,
} from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender, mockDeps } from '@test/test-container.js';

const STATION_ID = 'station-001';
const GENERATED_AT = '2026-09-01T10:00:00.000Z';

function makeMessage<T extends OcppRequest>(
  action: CallAction,
  payload: T,
  protocol: OCPPVersion = OCPPVersion.OCPP2_0_1,
): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION_ID,
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Monitoring,
    action,
    state: MessageState.Request,
    protocol,
  } as unknown as IMessage<T>;
}

describe('ReservationStatusUpdateRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  const RESERVATION_ID = 42;
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let reservationRepository: {
    findByStationAndReservationId: ReturnType<typeof vi.fn>;
    updateByStationAndReservationId: ReturnType<typeof vi.fn>;
  };
  let handler: ReservationStatusUpdateRequestOcpp2Handler;

  beforeEach(() => {
    vi.clearAllMocks();
    ocppSender = makeMockOcppSender();
    reservationRepository = {
      findByStationAndReservationId: vi.fn(),
      updateByStationAndReservationId: vi.fn().mockResolvedValue([]),
    };
    handler = new ReservationStatusUpdateRequestOcpp2Handler(
      mockDeps<typeof ReservationStatusUpdateRequestOcpp2Handler>({
        logger,
        ocppSender,
        reservationRepository,
      }),
    );
  });

  function aMessage(reservationUpdateStatus: ReservationUpdateStatusEnumType) {
    return makeMessage(OCPP_CallAction.ReservationStatusUpdate, {
      reservationId: RESERVATION_ID,
      reservationUpdateStatus,
    } as OCPP2_request_types.ReservationStatusUpdateRequest);
  }

  it('deactivates the reservation on an Expired update', async () => {
    reservationRepository.findByStationAndReservationId.mockResolvedValue({ databaseId: 77 });
    const message = aMessage(ReservationUpdateStatusEnum.Expired);

    await handler.handle(message);

    expect(reservationRepository.findByStationAndReservationId).toHaveBeenCalledOnce();
    expect(reservationRepository.findByStationAndReservationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION_ID,
      RESERVATION_ID,
    );
    expect(reservationRepository.updateByStationAndReservationId).toHaveBeenCalledOnce();
    expect(reservationRepository.updateByStationAndReservationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION_ID,
      RESERVATION_ID,
      { isActive: false },
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
  });

  it('deactivates the reservation on a Removed update', async () => {
    reservationRepository.findByStationAndReservationId.mockResolvedValue({ databaseId: 88 });

    await handler.handle(aMessage(ReservationUpdateStatusEnum.Removed));

    expect(reservationRepository.updateByStationAndReservationId).toHaveBeenCalledOnce();
    expect(reservationRepository.updateByStationAndReservationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION_ID,
      RESERVATION_ID,
      { isActive: false },
    );
  });

  it('leaves the reservation untouched on a NoTransaction update', async () => {
    reservationRepository.findByStationAndReservationId.mockResolvedValue({ databaseId: 77 });
    const message = aMessage(ReservationUpdateStatusEnum.NoTransaction);

    await handler.handle(message);

    expect(reservationRepository.updateByStationAndReservationId).not.toHaveBeenCalled();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
  });

  it('logs the missing reservation and still acknowledges', async () => {
    reservationRepository.findByStationAndReservationId.mockResolvedValue(undefined);
    const message = aMessage(ReservationUpdateStatusEnum.Expired);

    await handler.handle(message);

    expect(reservationRepository.updateByStationAndReservationId).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error.mock.calls[0][0]).toBe('Error reading reservation:');
    expect((logger.error.mock.calls[0][1] as Error).message).toBe('Reservation 42 not found');
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
  });

  it('logs a lookup failure and still acknowledges', async () => {
    reservationRepository.findByStationAndReservationId.mockRejectedValue(new Error('db down'));
    const message = aMessage(ReservationUpdateStatusEnum.Expired);

    await handler.handle(message);

    expect(logger.error).toHaveBeenCalledOnce();
    expect((logger.error.mock.calls[0][1] as Error).message).toBe('db down');
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
  });
});

describe('NotifyEventRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let componentRepository: {
    findOrCreateEvseAndComponentAndVariable: ReturnType<typeof vi.fn>;
  };
  let variableAttributeRepository: {
    createOrUpdateDeviceModelByStationId: ReturnType<typeof vi.fn>;
  };
  let variableMonitoringRepository: {
    createEventDatumByComponentIdAndVariableIdAndStationId: ReturnType<typeof vi.fn>;
  };
  let connectorStatusService: {
    updateConnectorStatus: ReturnType<typeof vi.fn>;
  };
  let handler: NotifyEventRequestOcpp2Handler;

  beforeEach(() => {
    vi.clearAllMocks();
    ocppSender = makeMockOcppSender();
    componentRepository = {
      findOrCreateEvseAndComponentAndVariable: vi.fn().mockResolvedValue([{ id: 3 }, { id: 9 }]),
    };
    variableAttributeRepository = {
      createOrUpdateDeviceModelByStationId: vi.fn().mockResolvedValue(undefined),
    };
    variableMonitoringRepository = {
      createEventDatumByComponentIdAndVariableIdAndStationId: vi.fn().mockResolvedValue(undefined),
    };
    connectorStatusService = {
      updateConnectorStatus: vi.fn().mockResolvedValue(undefined),
    };
    handler = new NotifyEventRequestOcpp2Handler(
      mockDeps<typeof NotifyEventRequestOcpp2Handler>({
        logger,
        ocppSender,
        componentRepository,
        variableAttributeRepository,
        variableMonitoringRepository,
        connectorStatusService,
      }),
    );
  });

  function anEvent(eventId: number, actualValue: string): OCPP2_0_1.EventDataType {
    return {
      eventId,
      timestamp: '2026-09-01T09:59:00.000Z',
      trigger: OCPP2_0_1.EventTriggerEnumType.Alerting,
      actualValue,
      eventNotificationType: OCPP2_0_1.EventNotificationEnumType.HardWiredMonitor,
      component: { name: 'ChargingStation' },
      variable: { name: 'Problem' },
    };
  }

  function aMessage(...eventData: OCPP2_0_1.EventDataType[]) {
    return makeMessage(OCPP_CallAction.NotifyEvent, {
      generatedAt: GENERATED_AT,
      seqNo: 0,
      eventData,
    } as OCPP2_0_1.NotifyEventRequest);
  }

  it('persists the event datum and mirrors the actual value into the device model', async () => {
    const event = anEvent(1, 'Faulted');
    const message = aMessage(event);

    await handler.handle(message);

    expect(componentRepository.findOrCreateEvseAndComponentAndVariable).toHaveBeenCalledOnce();
    expect(componentRepository.findOrCreateEvseAndComponentAndVariable).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      event.component,
      event.variable,
    );
    expect(
      variableMonitoringRepository.createEventDatumByComponentIdAndVariableIdAndStationId,
    ).toHaveBeenCalledOnce();
    expect(
      variableMonitoringRepository.createEventDatumByComponentIdAndVariableIdAndStationId,
    ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, event, STATION_ID, 3, 9);
    expect(variableAttributeRepository.createOrUpdateDeviceModelByStationId).toHaveBeenCalledOnce();
    expect(variableAttributeRepository.createOrUpdateDeviceModelByStationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      {
        component: { id: 3 },
        variable: { id: 9 },
        variableAttribute: [{ value: 'Faulted' }],
      },
      STATION_ID,
      GENERATED_AT,
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
  });

  it('persists each event of a multi-event report', async () => {
    const first = anEvent(1, 'Faulted');
    const second = anEvent(2, 'Available');

    await handler.handle(aMessage(first, second));

    expect(componentRepository.findOrCreateEvseAndComponentAndVariable).toHaveBeenCalledTimes(2);
    expect(
      variableMonitoringRepository.createEventDatumByComponentIdAndVariableIdAndStationId,
    ).toHaveBeenCalledTimes(2);
    expect(
      variableMonitoringRepository.createEventDatumByComponentIdAndVariableIdAndStationId,
    ).toHaveBeenNthCalledWith(2, DEFAULT_TENANT_ID, second, STATION_ID, 3, 9);
    expect(variableAttributeRepository.createOrUpdateDeviceModelByStationId).toHaveBeenCalledTimes(
      2,
    );
    expect(
      variableAttributeRepository.createOrUpdateDeviceModelByStationId.mock.calls[1][1],
    ).toMatchObject({ variableAttribute: [{ value: 'Available' }] });
  });

  it('propagates a persistence failure without acknowledging', async () => {
    variableMonitoringRepository.createEventDatumByComponentIdAndVariableIdAndStationId.mockRejectedValue(
      new Error('db down'),
    );

    await expect(handler.handle(aMessage(anEvent(1, 'Faulted')))).rejects.toThrow('db down');

    expect(variableAttributeRepository.createOrUpdateDeviceModelByStationId).not.toHaveBeenCalled();
    expect(ocppSender.sendCallResultWithMessage).not.toHaveBeenCalled();
  });

  describe('Connector AvailabilityState on OCPP 2.1', () => {
    const EVENT_TIMESTAMP = '2026-09-01T09:58:00.000Z';

    function anAvailabilityStateEvent(
      eventId: number,
      actualValue: string,
      component: OCPP2_1.ComponentType = { name: 'Connector', evse: { id: 2, connectorId: 1 } },
    ): OCPP2_1.EventDataType {
      return {
        eventId,
        timestamp: EVENT_TIMESTAMP,
        trigger: OCPP2_1.EventTriggerEnumType.Delta,
        actualValue,
        eventNotificationType: OCPP2_1.EventNotificationEnumType.HardWiredNotification,
        component,
        variable: { name: 'AvailabilityState' },
      };
    }

    function anOcpp21Message(...eventData: OCPP2_1.EventDataType[]) {
      return makeMessage(
        OCPP_CallAction.NotifyEvent,
        { generatedAt: GENERATED_AT, seqNo: 0, eventData } as OCPP2_1.NotifyEventRequest,
        OCPPVersion.OCPP2_1,
      );
    }

    it('updates the connector status from the reported value', async () => {
      const message = anOcpp21Message(anAvailabilityStateEvent(1, 'Occupied'));

      await handler.handle(message);

      expect(connectorStatusService.updateConnectorStatus).toHaveBeenCalledExactlyOnceWith(
        DEFAULT_TENANT_ID,
        STATION_ID,
        {
          evseId: 2,
          connectorId: 1,
          connectorStatus: ConnectorStatusEnum.Occupied,
          timestamp: EVENT_TIMESTAMP,
        },
      );
      expect(
        variableAttributeRepository.createOrUpdateDeviceModelByStationId,
      ).toHaveBeenCalledOnce();
      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
    });

    it('leaves the connector status alone for an OCPP 2.0.1 station', async () => {
      const message = makeMessage(OCPP_CallAction.NotifyEvent, {
        generatedAt: GENERATED_AT,
        seqNo: 0,
        eventData: [anAvailabilityStateEvent(1, 'Occupied')],
      } as OCPP2_1.NotifyEventRequest);

      await handler.handle(message);

      expect(connectorStatusService.updateConnectorStatus).not.toHaveBeenCalled();
      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
    });

    it('ignores AvailabilityState reported on a component other than Connector', async () => {
      await handler.handle(
        anOcpp21Message(
          anAvailabilityStateEvent(1, 'Occupied', { name: 'EVSE', evse: { id: 2 } }),
          anAvailabilityStateEvent(2, 'Available', { name: 'ChargingStation' }),
        ),
      );

      expect(connectorStatusService.updateConnectorStatus).not.toHaveBeenCalled();
    });

    it('ignores other Connector variables', async () => {
      const event: OCPP2_1.EventDataType = {
        ...anAvailabilityStateEvent(1, 'true'),
        variable: { name: 'Enabled' },
      };

      await handler.handle(anOcpp21Message(event));

      expect(connectorStatusService.updateConnectorStatus).not.toHaveBeenCalled();
    });

    it('skips an event without an EVSE or connector id', async () => {
      await handler.handle(
        anOcpp21Message(
          anAvailabilityStateEvent(1, 'Occupied', { name: 'Connector' }),
          anAvailabilityStateEvent(2, 'Occupied', { name: 'Connector', evse: { id: 2 } }),
        ),
      );

      expect(connectorStatusService.updateConnectorStatus).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('skips a value that is not a connector status', async () => {
      await handler.handle(anOcpp21Message(anAvailabilityStateEvent(1, 'Charging')));

      expect(connectorStatusService.updateConnectorStatus).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('updates only the qualifying events of a mixed report', async () => {
      await handler.handle(
        anOcpp21Message(
          anAvailabilityStateEvent(1, 'Faulted', {
            name: 'Connector',
            evse: { id: 1, connectorId: 1 },
          }),
          anAvailabilityStateEvent(2, 'Occupied', { name: 'EVSE', evse: { id: 1 } }),
          anAvailabilityStateEvent(3, 'Available', {
            name: 'Connector',
            evse: { id: 2, connectorId: 1 },
          }),
        ),
      );

      expect(connectorStatusService.updateConnectorStatus).toHaveBeenCalledTimes(2);
      expect(connectorStatusService.updateConnectorStatus.mock.calls[0][2]).toMatchObject({
        evseId: 1,
        connectorStatus: ConnectorStatusEnum.Faulted,
      });
      expect(connectorStatusService.updateConnectorStatus.mock.calls[1][2]).toMatchObject({
        evseId: 2,
        connectorStatus: ConnectorStatusEnum.Available,
      });
    });

    it('still stores the remaining events and acknowledges when the status update fails', async () => {
      connectorStatusService.updateConnectorStatus.mockRejectedValueOnce(new Error('db down'));
      const message = anOcpp21Message(
        anAvailabilityStateEvent(1, 'Occupied'),
        anAvailabilityStateEvent(2, 'Available', {
          name: 'Connector',
          evse: { id: 3, connectorId: 1 },
        }),
      );

      await handler.handle(message);

      expect(logger.error).toHaveBeenCalled();
      expect(connectorStatusService.updateConnectorStatus).toHaveBeenCalledTimes(2);
      expect(
        variableMonitoringRepository.createEventDatumByComponentIdAndVariableIdAndStationId,
      ).toHaveBeenCalledTimes(2);
      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
    });
  });
});

describe('NotifyMonitoringReportRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let componentRepository: {
    findOrCreateEvseAndComponentAndVariable: ReturnType<typeof vi.fn>;
  };
  let variableMonitoringRepository: {
    createOrUpdateByMonitoringDataTypeAndStationId: ReturnType<typeof vi.fn>;
  };
  let handler: NotifyMonitoringReportRequestOcpp2Handler;

  beforeEach(() => {
    vi.clearAllMocks();
    ocppSender = makeMockOcppSender();
    componentRepository = {
      findOrCreateEvseAndComponentAndVariable: vi.fn().mockResolvedValue([{ id: 5 }, { id: 11 }]),
    };
    variableMonitoringRepository = {
      createOrUpdateByMonitoringDataTypeAndStationId: vi.fn().mockResolvedValue(undefined),
    };
    handler = new NotifyMonitoringReportRequestOcpp2Handler(
      mockDeps<typeof NotifyMonitoringReportRequestOcpp2Handler>({
        logger,
        ocppSender,
        componentRepository,
        variableMonitoringRepository,
      }),
    );
  });

  const monitorEntry: OCPP2_0_1.MonitoringDataType = {
    component: { name: 'EVSE' },
    variable: { name: 'Voltage' },
    variableMonitoring: [
      {
        id: 15,
        transaction: false,
        value: 250,
        type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
        severity: 3,
      },
    ],
  };

  function aMessage(monitor?: OCPP2_0_1.MonitoringDataType[]) {
    return makeMessage(OCPP_CallAction.NotifyMonitoringReport, {
      requestId: 9,
      seqNo: 0,
      generatedAt: GENERATED_AT,
      monitor,
    } as OCPP2_0_1.NotifyMonitoringReportRequest);
  }

  it('stores the monitor entry under the resolved component and variable ids', async () => {
    const message = aMessage([monitorEntry]);

    await handler.handle(message);

    expect(componentRepository.findOrCreateEvseAndComponentAndVariable).toHaveBeenCalledOnce();
    expect(componentRepository.findOrCreateEvseAndComponentAndVariable).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      monitorEntry.component,
      monitorEntry.variable,
    );
    expect(
      variableMonitoringRepository.createOrUpdateByMonitoringDataTypeAndStationId,
    ).toHaveBeenCalledOnce();
    expect(
      variableMonitoringRepository.createOrUpdateByMonitoringDataTypeAndStationId,
    ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, monitorEntry, STATION_ID, 5, 11);
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
  });

  it('acknowledges a report without monitor data and touches no repository', async () => {
    const message = aMessage(undefined);

    await handler.handle(message);

    expect(componentRepository.findOrCreateEvseAndComponentAndVariable).not.toHaveBeenCalled();
    expect(
      variableMonitoringRepository.createOrUpdateByMonitoringDataTypeAndStationId,
    ).not.toHaveBeenCalled();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
  });
});

describe('ReportChargingProfilesRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let chargingProfileRepository: {
    createOrUpdateChargingProfile: ReturnType<typeof vi.fn>;
  };
  let handler: ReportChargingProfilesRequestOcpp2Handler;

  beforeEach(() => {
    vi.clearAllMocks();
    ocppSender = makeMockOcppSender();
    chargingProfileRepository = {
      createOrUpdateChargingProfile: vi.fn().mockResolvedValue(undefined),
    };
    handler = new ReportChargingProfilesRequestOcpp2Handler(
      mockDeps<typeof ReportChargingProfilesRequestOcpp2Handler>({
        logger,
        ocppSender,
        chargingProfileRepository,
      }),
    );
  });

  function aChargingProfile(id: number): OCPP2_0_1.ChargingProfileType {
    return {
      id,
      stackLevel: 2,
      chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
      chargingProfileKind: OCPP2_0_1.ChargingProfileKindEnumType.Absolute,
      recurrencyKind: OCPP2_0_1.RecurrencyKindEnumType.Daily,
      validFrom: '2026-09-01T00:00:00.000Z',
      validTo: '2026-09-02T00:00:00.000Z',
      transactionId: 'tx-1',
      chargingSchedule: [
        {
          id: 7,
          startSchedule: '2026-09-01T08:00:00.000Z',
          duration: 3600,
          chargingRateUnit: OCPP2_0_1.ChargingRateUnitEnumType.W,
          minChargingRate: 6,
          chargingSchedulePeriod: [
            { startPeriod: 0, limit: 11000, numberPhases: 3, phaseToUse: 1 },
          ],
        },
      ],
    };
  }

  function aMessage(...chargingProfile: OCPP2_0_1.ChargingProfileType[]) {
    return makeMessage(OCPP_CallAction.ReportChargingProfiles, {
      requestId: 33,
      chargingLimitSource: OCPP2_0_1.ChargingLimitSourceEnumType.CSO,
      evseId: 2,
      chargingProfile,
    } as OCPP2_0_1.ReportChargingProfilesRequest);
  }

  it('stores the mapped profile against the reported evse and limit source', async () => {
    const message = aMessage(aChargingProfile(101));

    await handler.handle(message);

    expect(chargingProfileRepository.createOrUpdateChargingProfile).toHaveBeenCalledOnce();
    expect(chargingProfileRepository.createOrUpdateChargingProfile).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      {
        id: 101,
        stackLevel: 2,
        chargingProfilePurpose: 'TxProfile',
        chargingProfileKind: 'Absolute',
        recurrencyKind: 'Daily',
        validFrom: '2026-09-01T00:00:00.000Z',
        validTo: '2026-09-02T00:00:00.000Z',
        transactionId: 'tx-1',
        chargingSchedule: [
          {
            id: 7,
            startSchedule: '2026-09-01T08:00:00.000Z',
            duration: 3600,
            chargingRateUnit: 'W',
            minChargingRate: 6,
            salesTariff: undefined,
            chargingSchedulePeriod: [
              { startPeriod: 0, limit: 11000, numberPhases: 3, phaseToUse: 1 },
            ],
          },
        ],
      },
      STATION_ID,
      2,
      OCPP2_0_1.ChargingLimitSourceEnumType.CSO,
      true,
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
  });

  it('stores every profile of the report in payload order', async () => {
    await handler.handle(aMessage(aChargingProfile(101), aChargingProfile(102)));

    expect(chargingProfileRepository.createOrUpdateChargingProfile).toHaveBeenCalledTimes(2);
    expect(chargingProfileRepository.createOrUpdateChargingProfile.mock.calls[0][1].id).toBe(101);
    expect(chargingProfileRepository.createOrUpdateChargingProfile.mock.calls[1][1].id).toBe(102);
  });
});

describe('StatusNotificationRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let statusNotificationService: {
    processStatusNotification: ReturnType<typeof vi.fn>;
  };
  let handler: StatusNotificationRequestOcpp2Handler;

  beforeEach(() => {
    vi.clearAllMocks();
    ocppSender = makeMockOcppSender();
    statusNotificationService = {
      processStatusNotification: vi.fn().mockResolvedValue(undefined),
    };
    handler = new StatusNotificationRequestOcpp2Handler(
      mockDeps<typeof StatusNotificationRequestOcpp2Handler>({
        logger,
        ocppSender,
        statusNotificationService,
      }),
    );
  });

  const payload: OCPP2_0_1.StatusNotificationRequest = {
    timestamp: '2026-09-01T10:00:00.000Z',
    connectorStatus: OCPP2_0_1.ConnectorStatusEnumType.Available,
    evseId: 1,
    connectorId: 1,
  };

  it('delegates the payload to the status notification service and acknowledges', async () => {
    const message = makeMessage(OCPP_CallAction.StatusNotification, payload);

    await handler.handle(message);

    expect(statusNotificationService.processStatusNotification).toHaveBeenCalledOnce();
    expect(statusNotificationService.processStatusNotification).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION_ID,
      payload,
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
  });

  it('logs a processing failure and still acknowledges', async () => {
    const failure = new Error('constraint violation');
    statusNotificationService.processStatusNotification.mockRejectedValue(failure);
    const message = makeMessage(OCPP_CallAction.StatusNotification, payload);

    await handler.handle(message);

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith('Failed to process status notification', failure);
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
  });
});
