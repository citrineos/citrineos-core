// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import {
  type ICache,
  type IMessage,
  CacheNamespace,
  createIdentifier,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import {
  type BootDto,
  type OcppRequest,
  type OCPP2_request_types,
  type SystemConfig,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
  RegistrationStatusEnum,
  ResetEnum,
  SetVariableStatusEnum,
} from '@citrineos/types';
import type { IChargingStationRepository, IDeviceModelRepository } from '@citrineos/dal';
import { ChargingStation } from '@citrineos/dal';
import type { BootNotificationService } from '@modules/configuration/boot-notification-service.js';
import type { DeviceModelService } from '@modules/configuration/device-model-service.js';
import { BootNotificationRequestOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';

// The Sequelize model is never initialized in unit tests, so build() would throw inside the
// handler's fire-and-forget station update. Passing the attributes through lets the
// createOrUpdateChargingStation assertions see exactly what the handler mapped from the payload.
vi.spyOn(ChargingStation, 'build').mockImplementation(((data: unknown) => data) as never);

const STATION_ID = 'station-001';
const IDENTIFIER = createIdentifier(DEFAULT_TENANT_ID, STATION_ID);
const CURRENT_TIME = '2026-01-01T00:00:00.000Z';
const TIMESTAMP = '2026-01-01T00:00:01.000Z';
const MAX_CACHING_SECONDS = 10;

const REQUEST = {
  reason: OCPP2_0_1.BootReasonEnumType.PowerUp,
  chargingStation: {
    vendorName: 'Voltempo',
    model: 'Hypercharger',
    serialNumber: 'HC-100',
    firmwareVersion: '1.2.3',
    modem: { iccid: 'iccid-1', imsi: 'imsi-1' },
  },
} as OCPP2_request_types.BootNotificationRequest;

const GET_BASE_REPORT_REQUEST = { requestId: 42, reportBase: 'FullInventory' };

const VAR_A = { attributeValue: 'a', component: { name: 'CompA' }, variable: { name: 'VarA' } };
const VAR_B = { attributeValue: 'b', component: { name: 'CompB' }, variable: { name: 'VarB' } };
const VAR_C = { attributeValue: 'c', component: { name: 'CompC' }, variable: { name: 'VarC' } };

function setVariablesResponseJson(...statuses: string[]): string {
  return JSON.stringify({
    setVariableResult: statuses.map((attributeStatus) => ({ attributeStatus })),
  });
}

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION_ID,
      correlationId: 'corr-001',
      timestamp: TIMESTAMP,
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Configuration,
    action: OCPP_CallAction.BootNotification,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<T>;
}

function makeHandler(
  options: {
    status?: string;
    cachedBootStatus?: string;
    connectionJson?: string;
    stationExists?: boolean;
    bootConfig?: Partial<BootDto>;
    systemBootConfig?: Partial<SystemConfig['ocpp']>;
    setVariableData?: unknown[];
    itemsPerMessage?: number | null;
    setVariablesResponses?: (string | null)[];
  } = {},
) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();

  const bootResponse = {
    status: options.status ?? RegistrationStatusEnum.Accepted,
    currentTime: CURRENT_TIME,
    interval: 60,
  };

  // Row returned by updateBootConfig; per-charger flags override the system config ones.
  const bootConfig = {
    id: 1,
    getBaseReportOnPending: false,
    bootWithRejectedVariables: false,
    pendingBootSetVariables: [],
    ...options.bootConfig,
  };

  const config = {
    timeouts: { maxCachingSeconds: MAX_CACHING_SECONDS },
    ocpp: {
      getBaseReportOnPending: false,
      bootWithRejectedVariables: false,
      autoAccept: false,
      ...options.systemBootConfig,
    },
  } as unknown as SystemConfig;

  const cache = {
    // The boot status get is (BootStatus, identifier); the connection get is
    // (identifier, Connections).
    get: vi.fn().mockImplementation(async (key: string, namespace: string) => {
      if (key === CacheNamespace.BootStatus) return options.cachedBootStatus ?? null;
      if (namespace === CacheNamespace.Connections) return options.connectionJson ?? null;
      return null;
    }),
    set: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    onChange: vi.fn().mockResolvedValue(null),
  };
  for (const response of options.setVariablesResponses ?? []) {
    cache.onChange.mockResolvedValueOnce(response);
  }

  const bootService = {
    createBootNotificationResponse: vi.fn().mockResolvedValue(bootResponse),
    cacheChargerActionsPermissions: vi.fn().mockResolvedValue(undefined),
    updateBootConfig: vi.fn().mockResolvedValue(bootConfig),
    createGetBaseReportRequest: vi.fn().mockResolvedValue(GET_BASE_REPORT_REQUEST),
    confirmGetBaseReportSuccess: vi.fn().mockResolvedValue(undefined),
    updateBoot: vi.fn().mockResolvedValue(undefined),
  };

  const deviceModelService = {
    updateDeviceModel: vi.fn().mockResolvedValue(undefined),
    getItemsPerMessageSetVariablesByStationId: vi
      .fn()
      .mockResolvedValue(options.itemsPerMessage ?? null),
  };

  const deviceModelRepository = {
    readAllSetVariableByStationId: vi.fn().mockResolvedValue(options.setVariableData ?? []),
  };

  const chargingStationRepository = {
    doesChargingStationExistByOcppConnectionName: vi
      .fn()
      .mockResolvedValue(options.stationExists ?? true),
    createOrUpdateChargingStation: vi.fn().mockResolvedValue(undefined),
  };

  const handler = new BootNotificationRequestOcpp2Handler({
    logger,
    ocppSender,
    cache: cache as unknown as ICache,
    config,
    bootNotificationService: bootService as unknown as BootNotificationService,
    configurationDeviceModelService: deviceModelService as unknown as DeviceModelService,
    deviceModelRepository: deviceModelRepository as unknown as IDeviceModelRepository,
    chargingStationRepository: chargingStationRepository as unknown as IChargingStationRepository,
  });

  return {
    handler,
    logger,
    ocppSender,
    cache,
    bootService,
    deviceModelService,
    deviceModelRepository,
    chargingStationRepository,
    bootResponse,
  };
}

describe('BootNotificationRequestOcpp2Handler', () => {
  describe('response delivery', () => {
    it('sends the boot service response back on the incoming message', async () => {
      const { handler, ocppSender, bootService, bootResponse } = makeHandler({
        status: RegistrationStatusEnum.Accepted,
      });
      const message = makeMessage(REQUEST);

      await handler.handle(message);

      expect(bootService.createBootNotificationResponse).toHaveBeenCalledExactlyOnceWith(
        DEFAULT_TENANT_ID,
        STATION_ID,
      );
      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledExactlyOnceWith(
        message,
        bootResponse,
      );
      expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({
        status: RegistrationStatusEnum.Accepted,
        currentTime: CURRENT_TIME,
        interval: 60,
      });
      // Accepted boot: no configuration flow.
      expect(ocppSender.sendCall).not.toHaveBeenCalled();
    });

    it('throws when the sender reports failure and skips the boot config update', async () => {
      const { handler, ocppSender, bootService, cache } = makeHandler();
      ocppSender.sendCallResultWithMessage.mockResolvedValue({ success: false });

      await expect(handler.handle(makeMessage(REQUEST))).rejects.toThrow('BootNotification failed');

      expect(bootService.updateBootConfig).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  describe('station and device model update', () => {
    it('upserts the station row from the payload, then updates the device model', async () => {
      const { handler, chargingStationRepository, deviceModelService } = makeHandler();

      await handler.handle(makeMessage(REQUEST));

      expect(
        chargingStationRepository.createOrUpdateChargingStation,
      ).toHaveBeenCalledExactlyOnceWith(DEFAULT_TENANT_ID, {
        tenantId: DEFAULT_TENANT_ID,
        ocppConnectionName: STATION_ID,
        chargePointVendor: 'Voltempo',
        chargePointModel: 'Hypercharger',
        chargePointSerialNumber: 'HC-100',
        firmwareVersion: '1.2.3',
        iccid: 'iccid-1',
        imsi: 'imsi-1',
      });
      expect(deviceModelService.updateDeviceModel).toHaveBeenCalledExactlyOnceWith(
        REQUEST.chargingStation,
        DEFAULT_TENANT_ID,
        STATION_ID,
        TIMESTAMP,
      );
    });

    it('drops the station update for an unknown station when the connection disallows unknowns', async () => {
      const { handler, logger, chargingStationRepository, deviceModelService, bootService } =
        makeHandler({ stationExists: false });

      await handler.handle(makeMessage(REQUEST));

      expect(
        chargingStationRepository.doesChargingStationExistByOcppConnectionName,
      ).toHaveBeenCalledExactlyOnceWith(DEFAULT_TENANT_ID, STATION_ID);
      expect(chargingStationRepository.createOrUpdateChargingStation).not.toHaveBeenCalled();
      expect(deviceModelService.updateDeviceModel).not.toHaveBeenCalled();
      // The failure is swallowed and logged; the rest of the boot flow still runs.
      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining(`Error updating station ${STATION_ID}`),
        expect.any(Error),
      );
      expect(bootService.updateBootConfig).toHaveBeenCalledTimes(1);
    });

    it('skips the existence check when the connection allows unknown stations', async () => {
      const { handler, chargingStationRepository } = makeHandler({
        stationExists: false,
        connectionJson: JSON.stringify({ allowUnknownChargingStations: true }),
      });

      await handler.handle(makeMessage(REQUEST));

      expect(
        chargingStationRepository.doesChargingStationExistByOcppConnectionName,
      ).not.toHaveBeenCalled();
      expect(chargingStationRepository.createOrUpdateChargingStation).toHaveBeenCalledTimes(1);
    });
  });

  describe('boot status caching', () => {
    it('caches a Rejected status under the tenant-scoped identifier', async () => {
      const { handler, cache, bootService, ocppSender } = makeHandler({
        status: RegistrationStatusEnum.Rejected,
      });

      await handler.handle(makeMessage(REQUEST));

      expect(cache.set).toHaveBeenCalledExactlyOnceWith(
        CacheNamespace.BootStatus,
        RegistrationStatusEnum.Rejected,
        IDENTIFIER,
      );
      expect(bootService.cacheChargerActionsPermissions).toHaveBeenCalledExactlyOnceWith(
        IDENTIFIER,
        null,
        RegistrationStatusEnum.Rejected,
      );
      // Rejected boot: no configuration flow.
      expect(ocppSender.sendCall).not.toHaveBeenCalled();
    });

    it('does not restart configuration on a Pending boot while one is already pending', async () => {
      const { handler, cache, bootService, ocppSender } = makeHandler({
        status: RegistrationStatusEnum.Pending,
        cachedBootStatus: RegistrationStatusEnum.Pending,
        bootConfig: { getBaseReportOnPending: true },
        systemBootConfig: { autoAccept: true },
      });

      await handler.handle(makeMessage(REQUEST));

      // Same status as cached: no re-cache; configuration already in progress: no calls out.
      expect(cache.set).not.toHaveBeenCalled();
      expect(cache.remove).not.toHaveBeenCalled();
      expect(ocppSender.sendCall).not.toHaveBeenCalled();
      expect(bootService.updateBoot).not.toHaveBeenCalled();
      expect(bootService.updateBootConfig).toHaveBeenCalledTimes(1);
    });

    it('replaces a cached Rejected with Pending and starts configuration', async () => {
      const { handler, cache, ocppSender, bootService } = makeHandler({
        status: RegistrationStatusEnum.Pending,
        cachedBootStatus: RegistrationStatusEnum.Rejected,
        bootConfig: { getBaseReportOnPending: true },
      });

      await handler.handle(makeMessage(REQUEST));

      expect(cache.set).toHaveBeenCalledExactlyOnceWith(
        CacheNamespace.BootStatus,
        RegistrationStatusEnum.Pending,
        IDENTIFIER,
      );
      expect(bootService.cacheChargerActionsPermissions).toHaveBeenCalledExactlyOnceWith(
        IDENTIFIER,
        RegistrationStatusEnum.Rejected,
        RegistrationStatusEnum.Pending,
      );
      expect(ocppSender.sendCall).toHaveBeenCalledTimes(1);
    });
  });

  describe('pending boot: GetBaseReport', () => {
    it('runs the full GetBaseReport round trip when the boot config asks for it', async () => {
      const { handler, cache, ocppSender, bootService } = makeHandler({
        status: RegistrationStatusEnum.Pending,
        bootConfig: { getBaseReportOnPending: true },
      });

      await handler.handle(makeMessage(REQUEST));

      expect(cache.remove).toHaveBeenCalledExactlyOnceWith(
        OCPP_CallAction.NotifyReport,
        IDENTIFIER,
      );
      expect(bootService.createGetBaseReportRequest).toHaveBeenCalledExactlyOnceWith(
        DEFAULT_TENANT_ID,
        STATION_ID,
        MAX_CACHING_SECONDS,
      );
      expect(ocppSender.sendCall).toHaveBeenCalledExactlyOnceWith({
        ocppConnectionName: STATION_ID,
        tenantId: DEFAULT_TENANT_ID,
        protocol: OCPPVersion.OCPP2_0_1,
        action: OCPP_CallAction.GetBaseReport,
        eventGroup: EventGroup.Configuration,
        payload: GET_BASE_REPORT_REQUEST,
      });
      expect(bootService.confirmGetBaseReportSuccess).toHaveBeenCalledExactlyOnceWith(
        DEFAULT_TENANT_ID,
        STATION_ID,
        '42',
        { success: true },
        MAX_CACHING_SECONDS,
      );
      // Flag reset so the next boot attempt does not re-trigger the report.
      expect(bootService.updateBoot).toHaveBeenCalledExactlyOnceWith(
        DEFAULT_TENANT_ID,
        { getBaseReportOnPending: false },
        STATION_ID,
      );
    });

    it('falls back to the system config flag when the boot config leaves it null', async () => {
      const { handler, ocppSender } = makeHandler({
        status: RegistrationStatusEnum.Pending,
        bootConfig: { getBaseReportOnPending: null },
        systemBootConfig: { getBaseReportOnPending: true },
      });

      await handler.handle(makeMessage(REQUEST));

      expect(ocppSender.sendCall).toHaveBeenCalledTimes(1);
      expect(ocppSender.sendCall.mock.calls[0][0].action).toBe(OCPP_CallAction.GetBaseReport);
    });

    it('skips GetBaseReport when both flags are off', async () => {
      const { handler, cache, ocppSender } = makeHandler({
        status: RegistrationStatusEnum.Pending,
      });

      await handler.handle(makeMessage(REQUEST));

      expect(cache.remove).not.toHaveBeenCalled();
      expect(ocppSender.sendCall).not.toHaveBeenCalled();
    });
  });

  describe('pending boot: SetVariables', () => {
    it('chunks SetVariables by ItemsPerMessageSetVariables and waits on each response', async () => {
      const { handler, cache, ocppSender, bootService } = makeHandler({
        status: RegistrationStatusEnum.Pending,
        bootConfig: { pendingBootSetVariables: [{ id: 1 }] as BootDto['pendingBootSetVariables'] },
        setVariableData: [VAR_A, VAR_B, VAR_C],
        itemsPerMessage: 2,
        setVariablesResponses: [
          setVariablesResponseJson(SetVariableStatusEnum.Accepted, SetVariableStatusEnum.Accepted),
          setVariablesResponseJson(SetVariableStatusEnum.Accepted),
        ],
      });

      await handler.handle(makeMessage(REQUEST));

      expect(ocppSender.sendCall).toHaveBeenCalledTimes(2);
      const [first, second] = ocppSender.sendCall.mock.calls.map((call) => call[0]);
      expect(first.action).toBe(OCPP_CallAction.SetVariables);
      expect(first.payload).toEqual({ setVariableData: [VAR_A, VAR_B] });
      expect(second.payload).toEqual({ setVariableData: [VAR_C] });
      expect(first.correlationId).not.toBe(second.correlationId);
      expect(cache.onChange).toHaveBeenCalledTimes(2);
      expect(cache.onChange).toHaveBeenNthCalledWith(
        1,
        first.correlationId,
        MAX_CACHING_SECONDS,
        STATION_ID,
      );
      // All accepted, autoAccept off: boot status is left for the charger to retry.
      expect(bootService.updateBoot).not.toHaveBeenCalled();
    });

    it('sends every variable at once when ItemsPerMessageSetVariables is not set, and rejects the boot on a rejected variable', async () => {
      const { handler, ocppSender, bootService } = makeHandler({
        status: RegistrationStatusEnum.Pending,
        bootConfig: {
          pendingBootSetVariables: [{ id: 1 }] as BootDto['pendingBootSetVariables'],
          bootWithRejectedVariables: false,
        },
        systemBootConfig: { autoAccept: true },
        setVariableData: [VAR_A, VAR_B],
        itemsPerMessage: null,
        setVariablesResponses: [
          setVariablesResponseJson(SetVariableStatusEnum.Rejected, SetVariableStatusEnum.Accepted),
        ],
      });

      await handler.handle(makeMessage(REQUEST));

      expect(ocppSender.sendCall).toHaveBeenCalledTimes(1);
      expect(ocppSender.sendCall.mock.calls[0][0].payload).toEqual({
        setVariableData: [VAR_A, VAR_B],
      });
      // Rejection wins over autoAccept: exactly one status update, to Rejected.
      expect(bootService.updateBoot).toHaveBeenCalledExactlyOnceWith(
        DEFAULT_TENANT_ID,
        { status: RegistrationStatusEnum.Rejected },
        STATION_ID,
      );
    });

    it('auto-accepts despite a rejected variable when bootWithRejectedVariables is on', async () => {
      const { handler, bootService } = makeHandler({
        status: RegistrationStatusEnum.Pending,
        bootConfig: {
          pendingBootSetVariables: [{ id: 1 }] as BootDto['pendingBootSetVariables'],
          bootWithRejectedVariables: true,
        },
        systemBootConfig: { autoAccept: true },
        setVariableData: [VAR_A],
        setVariablesResponses: [setVariablesResponseJson(SetVariableStatusEnum.Rejected)],
      });

      await handler.handle(makeMessage(REQUEST));

      expect(bootService.updateBoot).toHaveBeenCalledExactlyOnceWith(
        DEFAULT_TENANT_ID,
        { status: RegistrationStatusEnum.Accepted },
        STATION_ID,
      );
    });

    it('sends an Immediate Reset when a variable requires reboot', async () => {
      const { handler, ocppSender, bootService } = makeHandler({
        status: RegistrationStatusEnum.Pending,
        bootConfig: { pendingBootSetVariables: [{ id: 1 }] as BootDto['pendingBootSetVariables'] },
        setVariableData: [VAR_A],
        setVariablesResponses: [setVariablesResponseJson(SetVariableStatusEnum.RebootRequired)],
      });

      await handler.handle(makeMessage(REQUEST));

      // One SetVariables call, then the Reset.
      expect(ocppSender.sendCall).toHaveBeenCalledTimes(2);
      expect(ocppSender.sendCall).toHaveBeenLastCalledWith({
        ocppConnectionName: STATION_ID,
        tenantId: DEFAULT_TENANT_ID,
        protocol: OCPPVersion.OCPP2_0_1,
        action: OCPP_CallAction.Reset,
        eventGroup: EventGroup.Configuration,
        payload: { type: ResetEnum.Immediate },
      });
      expect(bootService.updateBoot).not.toHaveBeenCalled();
    });

    it('throws when the SetVariables response never lands in the cache', async () => {
      const { handler } = makeHandler({
        status: RegistrationStatusEnum.Pending,
        bootConfig: { pendingBootSetVariables: [{ id: 1 }] as BootDto['pendingBootSetVariables'] },
        setVariableData: [VAR_A],
        setVariablesResponses: [null],
      });

      await expect(handler.handle(makeMessage(REQUEST))).rejects.toThrow(
        'SetVariables response not found',
      );
    });
  });
});
