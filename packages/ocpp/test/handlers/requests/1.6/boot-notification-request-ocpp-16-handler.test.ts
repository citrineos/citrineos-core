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
  type ChangeConfigurationDto,
  type OcppRequest,
  type SystemConfig,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type {
  IBootRepository,
  IChangeConfigurationRepository,
  IChargingStationRepository,
} from '@citrineos/dal';
import { ChargingStation } from '@citrineos/dal';
import type { BootNotificationService } from '@modules/configuration/boot-notification-service.js';
import { BootNotificationRequestOcpp16Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';

// The Sequelize model is never initialized in unit tests, so build() would throw inside the
// handler's fire-and-forget station update. Pass the attributes through instead.
vi.spyOn(ChargingStation, 'build').mockImplementation(((data: unknown) => data) as never);

const STATION_ID = 'station-001';
const IDENTIFIER = createIdentifier(DEFAULT_TENANT_ID, STATION_ID);
const { Accepted, Pending, Rejected } = OCPP1_6.BootNotificationResponseStatus;

const REQUEST = {
  chargePointVendor: 'Voltempo',
  chargePointModel: 'Hypercharger',
  firmwareVersion: '1.2.3',
} as OCPP1_6.BootNotificationRequest;

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION_ID,
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Configuration,
    action: OCPP_CallAction.BootNotification,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<T>;
}

function makeHandler(options: {
  status: OCPP1_6.BootNotificationResponseStatus;
  cachedBootStatus?: OCPP1_6.BootNotificationResponseStatus;
  connectionJson?: string;
  stationExists?: boolean;
  sendResponseSuccess?: boolean;
  configurations?: ChangeConfigurationDto[];
  // success per outgoing call action; unlisted actions succeed
  sendCallFailures?: OCPP_CallAction[];
}) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();
  ocppSender.sendCallResultWithMessage.mockResolvedValue({
    success: options.sendResponseSuccess ?? true,
  });
  ocppSender.sendCall.mockImplementation(async (call: { action: OCPP_CallAction }) => ({
    success: !(options.sendCallFailures ?? []).includes(call.action),
  }));

  const cache = {
    // First get is (BootStatus, identifier), second is (identifier, Connections).
    get: vi.fn().mockImplementation(async (key: string, namespace: string) => {
      if (key === CacheNamespace.BootStatus) return options.cachedBootStatus ?? null;
      if (namespace === CacheNamespace.Connections) return options.connectionJson ?? null;
      return null;
    }),
    set: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    onChange: vi.fn().mockResolvedValue(null),
  };

  const response: OCPP1_6.BootNotificationResponse = {
    status: options.status,
    currentTime: '2025-01-01T00:00:00.000Z',
    interval: 60,
  };
  const bootNotificationService = {
    createOcpp16BootNotificationResponse: vi.fn().mockResolvedValue(response),
    cacheOcpp16ChargerActionsPermissions: vi.fn().mockResolvedValue(undefined),
    updateOcpp16BootConfig: vi.fn().mockResolvedValue({ id: 1 }),
  };

  const bootRepository = { updateByKey: vi.fn().mockResolvedValue({}) };
  const changeConfigurationRepository = {
    listByStation: vi.fn().mockResolvedValue(options.configurations ?? []),
  };
  const chargingStationRepository = {
    doesChargingStationExistByOcppConnectionName: vi
      .fn()
      .mockResolvedValue(options.stationExists ?? true),
    createOrUpdateChargingStation: vi.fn().mockResolvedValue(undefined),
  };

  const handler = new BootNotificationRequestOcpp16Handler({
    logger,
    ocppSender,
    cache: cache as unknown as ICache,
    config: { timeouts: { maxCachingSeconds: 10 } } as unknown as SystemConfig,
    bootNotificationService: bootNotificationService as unknown as BootNotificationService,
    bootRepository: bootRepository as unknown as IBootRepository,
    changeConfigurationRepository:
      changeConfigurationRepository as unknown as IChangeConfigurationRepository,
    chargingStationRepository: chargingStationRepository as unknown as IChargingStationRepository,
  });

  return {
    handler,
    logger,
    ocppSender,
    cache,
    response,
    bootNotificationService,
    bootRepository,
    changeConfigurationRepository,
    chargingStationRepository,
  };
}

describe('BootNotificationRequestOcpp16Handler', () => {
  it('sends the boot service response back over the received message', async () => {
    const { handler, ocppSender, response } = makeHandler({ status: Accepted });

    const message = makeMessage(REQUEST);
    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, response);
  });

  it('hands the cached and new statuses to the charger actions permission cache', async () => {
    const { handler, bootNotificationService } = makeHandler({
      status: Rejected,
      cachedBootStatus: Pending,
    });

    await handler.handle(makeMessage(REQUEST));

    expect(bootNotificationService.cacheOcpp16ChargerActionsPermissions).toHaveBeenCalledOnce();
    expect(bootNotificationService.cacheOcpp16ChargerActionsPermissions).toHaveBeenCalledWith(
      IDENTIFIER,
      Pending,
      Rejected,
    );
  });

  it('throws when the response send is not confirmed', async () => {
    const { handler, cache, bootNotificationService } = makeHandler({
      status: Rejected,
      sendResponseSuccess: false,
    });

    await expect(handler.handle(makeMessage(REQUEST))).rejects.toThrow(
      'Send BootNotification response failed',
    );
    // The throw happens before status caching and boot config update.
    expect(cache.set).not.toHaveBeenCalled();
    expect(bootNotificationService.updateOcpp16BootConfig).not.toHaveBeenCalled();
  });

  describe('charging station persistence', () => {
    it('writes the boot payload fields onto the station record', async () => {
      const { handler, chargingStationRepository } = makeHandler({ status: Accepted });

      await handler.handle(makeMessage(REQUEST));

      expect(chargingStationRepository.createOrUpdateChargingStation).toHaveBeenCalledOnce();
      const [tenantId, station] =
        chargingStationRepository.createOrUpdateChargingStation.mock.calls[0];
      expect(tenantId).toBe(DEFAULT_TENANT_ID);
      expect(station.ocppConnectionName).toBe(STATION_ID);
      expect(station.chargePointVendor).toBe('Voltempo');
      expect(station.chargePointModel).toBe('Hypercharger');
      expect(station.firmwareVersion).toBe('1.2.3');
    });

    it('skips the existence check when the connection allows unknown stations', async () => {
      const { handler, chargingStationRepository } = makeHandler({
        status: Accepted,
        connectionJson: JSON.stringify({ id: STATION_ID, allowUnknownChargingStations: true }),
        stationExists: false,
      });

      await handler.handle(makeMessage(REQUEST));

      expect(
        chargingStationRepository.doesChargingStationExistByOcppConnectionName,
      ).not.toHaveBeenCalled();
      expect(chargingStationRepository.createOrUpdateChargingStation).toHaveBeenCalledOnce();
    });

    it('logs instead of failing the boot when an unknown station is disallowed', async () => {
      const { handler, logger, chargingStationRepository, bootNotificationService } = makeHandler({
        status: Accepted,
        stationExists: false,
      });

      await handler.handle(makeMessage(REQUEST));

      expect(chargingStationRepository.createOrUpdateChargingStation).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledOnce();
      expect(logger.error.mock.calls[0][0]).toContain(STATION_ID);
      // The boot itself still completes.
      expect(bootNotificationService.updateOcpp16BootConfig).toHaveBeenCalledOnce();
    });
  });

  describe('boot status caching', () => {
    it('does not cache an Accepted status', async () => {
      const { handler, cache } = makeHandler({ status: Accepted });

      await handler.handle(makeMessage(REQUEST));

      expect(cache.set).not.toHaveBeenCalled();
    });

    it('caches Pending when nothing is cached yet', async () => {
      const { handler, cache } = makeHandler({ status: Pending });

      await handler.handle(makeMessage(REQUEST));

      expect(cache.set).toHaveBeenCalledOnce();
      expect(cache.set).toHaveBeenCalledWith(CacheNamespace.BootStatus, Pending, IDENTIFIER);
    });

    it('does not rewrite a status equal to the cached one', async () => {
      const { handler, cache } = makeHandler({ status: Rejected, cachedBootStatus: Rejected });

      await handler.handle(makeMessage(REQUEST));

      expect(cache.set).not.toHaveBeenCalled();
    });

    it('replaces a cached Pending with Rejected', async () => {
      const { handler, cache } = makeHandler({ status: Rejected, cachedBootStatus: Pending });

      await handler.handle(makeMessage(REQUEST));

      expect(cache.set).toHaveBeenCalledWith(CacheNamespace.BootStatus, Rejected, IDENTIFIER);
    });
  });

  it('updates the boot config with the response it sent', async () => {
    const { handler, response, bootNotificationService } = makeHandler({ status: Accepted });

    await handler.handle(makeMessage(REQUEST));

    expect(bootNotificationService.updateOcpp16BootConfig).toHaveBeenCalledOnce();
    expect(bootNotificationService.updateOcpp16BootConfig).toHaveBeenCalledWith(
      response,
      DEFAULT_TENANT_ID,
      STATION_ID,
    );
  });

  describe('configuration sync gating', () => {
    it('does not sync configurations on Accepted', async () => {
      const { handler, ocppSender, cache, bootRepository } = makeHandler({ status: Accepted });

      await handler.handle(makeMessage(REQUEST));

      expect(ocppSender.sendCall).not.toHaveBeenCalled();
      expect(cache.remove).not.toHaveBeenCalled();
      expect(bootRepository.updateByKey).not.toHaveBeenCalled();
    });

    it('does not restart a sync already in progress for a cached Pending', async () => {
      const { handler, ocppSender, changeConfigurationRepository } = makeHandler({
        status: Pending,
        cachedBootStatus: Pending,
      });

      await handler.handle(makeMessage(REQUEST));

      expect(ocppSender.sendCall).not.toHaveBeenCalled();
      expect(changeConfigurationRepository.listByStation).not.toHaveBeenCalled();
    });

    it('syncs on Pending when the cached status is Rejected', async () => {
      const { handler, ocppSender } = makeHandler({
        status: Pending,
        cachedBootStatus: Rejected,
      });

      await handler.handle(makeMessage(REQUEST));

      const actions = ocppSender.sendCall.mock.calls.map((call) => call[0].action);
      expect(actions).toEqual([OCPP_CallAction.GetConfiguration, OCPP_CallAction.TriggerMessage]);
    });
  });

  describe('configuration sync on Pending', () => {
    const CONFIGURATIONS: ChangeConfigurationDto[] = [
      { ocppConnectionName: STATION_ID, key: 'HeartbeatInterval', value: '300' },
      { ocppConnectionName: STATION_ID, key: 'MeterValueSampleInterval', value: '60' },
    ];

    it('sends each stored ChangeConfiguration, then GetConfiguration, then TriggerMessage', async () => {
      const { handler, ocppSender, changeConfigurationRepository } = makeHandler({
        status: Pending,
        configurations: CONFIGURATIONS,
      });

      await handler.handle(makeMessage(REQUEST));

      expect(changeConfigurationRepository.listByStation).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        STATION_ID,
      );
      expect(ocppSender.sendCall).toHaveBeenCalledTimes(4);
      const calls = ocppSender.sendCall.mock.calls.map((call) => call[0]);
      expect(calls[0].action).toBe(OCPP_CallAction.ChangeConfiguration);
      // Only key and value are forwarded; the rest of the DTO is dropped.
      expect(calls[0].payload).toEqual({ key: 'HeartbeatInterval', value: '300' });
      expect(calls[1].payload).toEqual({ key: 'MeterValueSampleInterval', value: '60' });
      expect(calls[2].action).toBe(OCPP_CallAction.GetConfiguration);
      expect(calls[2].payload).toEqual({});
      expect(calls[3].action).toBe(OCPP_CallAction.TriggerMessage);
      expect(calls[3].payload).toEqual({
        requestedMessage: OCPP1_6.TriggerMessageRequestRequestedMessage.BootNotification,
      });
    });

    it('waits on a cache change keyed by each ChangeConfiguration correlationId', async () => {
      const { handler, ocppSender, cache } = makeHandler({
        status: Pending,
        configurations: CONFIGURATIONS,
      });

      await handler.handle(makeMessage(REQUEST));

      expect(cache.onChange).toHaveBeenCalledTimes(2);
      // timeouts.maxCachingSeconds from config; key matches the correlationId of the sent call.
      expect(cache.onChange.mock.calls[0]).toEqual([
        ocppSender.sendCall.mock.calls[0][0].correlationId,
        10,
        STATION_ID,
      ]);
    });

    it('unblacklists ChangeConfiguration, GetConfiguration and TriggerMessage', async () => {
      const { handler, cache } = makeHandler({ status: Pending });

      await handler.handle(makeMessage(REQUEST));

      expect(cache.remove.mock.calls).toEqual([
        [OCPP_CallAction.ChangeConfiguration, IDENTIFIER],
        [OCPP_CallAction.GetConfiguration, IDENTIFIER],
        [OCPP_CallAction.TriggerMessage, IDENTIFIER],
      ]);
    });

    it('records a clean sync on the boot entity', async () => {
      const { handler, bootRepository } = makeHandler({
        status: Pending,
        configurations: CONFIGURATIONS,
      });

      await handler.handle(makeMessage(REQUEST));

      expect(bootRepository.updateByKey).toHaveBeenCalledOnce();
      expect(bootRepository.updateByKey).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        { changeConfigurationsOnPending: false, getConfigurationsOnPending: false },
        STATION_ID,
      );
    });

    it('flags changeConfigurationsOnPending when a ChangeConfiguration call fails', async () => {
      const { handler, bootRepository } = makeHandler({
        status: Pending,
        configurations: CONFIGURATIONS,
        sendCallFailures: [OCPP_CallAction.ChangeConfiguration],
      });

      await handler.handle(makeMessage(REQUEST));

      expect(bootRepository.updateByKey).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        { changeConfigurationsOnPending: true, getConfigurationsOnPending: false },
        STATION_ID,
      );
    });

    it('flags getConfigurationsOnPending when the GetConfiguration call fails', async () => {
      const { handler, bootRepository } = makeHandler({
        status: Pending,
        sendCallFailures: [OCPP_CallAction.GetConfiguration],
      });

      await handler.handle(makeMessage(REQUEST));

      expect(bootRepository.updateByKey).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        { changeConfigurationsOnPending: false, getConfigurationsOnPending: true },
        STATION_ID,
      );
    });
  });
});
