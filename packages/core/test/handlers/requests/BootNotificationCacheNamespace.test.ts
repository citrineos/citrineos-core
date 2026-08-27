// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import {
  type BootstrapConfig,
  type ICache,
  type IMessage,
  BOOT_STATUS,
  createIdentifier,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import {
  type OcppRequest,
  type SystemConfig,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
  RegistrationStatusEnum,
} from '@citrineos/types';
import {
  BootNotificationRequestOcpp16Handler,
  BootNotificationRequestOcpp2Handler,
} from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/testContainer.js';

const STATION_ID = 'station-001';

// MessageRouterImpl reads both of these under `createIdentifier(tenantId, ocppConnectionName)`:
// _onCallIsAllowed does `cache.exists(action, identifier)` and _sendCallIsAllowed does
// `cache.get(BOOT_STATUS, identifier)`. Anything the boot handlers write under a different
// namespace is never read, so the Pending/Rejected gate has no effect and two tenants owning a
// station of the same name share one entry.
const IDENTIFIER = createIdentifier(DEFAULT_TENANT_ID, STATION_ID);

function makeConfig(): BootstrapConfig & SystemConfig {
  return {
    maxCachingSeconds: 10,
    modules: {
      configuration: {
        requests: [],
        responses: [],
        ocpp2_0_1: { getBaseReportOnPending: false },
      },
    },
  } as unknown as BootstrapConfig & SystemConfig;
}

function makeMessage<T extends OcppRequest>(payload: T, protocol: OCPPVersion): IMessage<T> {
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
    protocol,
  } as unknown as IMessage<T>;
}

function makeCache() {
  return {
    // Only the Connections lookup should return a value; BOOT_STATUS starts empty.
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    onChange: vi.fn().mockResolvedValue(null),
  };
}

function makeLocationRepository() {
  return {
    doesChargingStationExistByStationId: vi.fn().mockResolvedValue(true),
    createOrUpdateChargingStation: vi.fn().mockResolvedValue(undefined),
  };
}

describe('BootNotification cache namespacing', () => {
  describe('OCPP 1.6', () => {
    function makeHandler(status: OCPP1_6.BootNotificationResponseStatus) {
      const { logger } = createTestContainer();
      const cache = makeCache();
      const bootNotificationService = {
        createOcpp16BootNotificationResponse: vi
          .fn()
          .mockResolvedValue({ status, currentTime: new Date().toISOString(), interval: 60 }),
        cacheOcpp16ChargerActionsPermissions: vi.fn().mockResolvedValue(undefined),
        updateOcpp16BootConfig: vi.fn().mockResolvedValue({ id: 1 }),
      };

      const handler = new BootNotificationRequestOcpp16Handler({
        logger,
        ocppSender: makeMockOcppSender(),
        cache: cache as unknown as ICache,
        config: makeConfig(),
        bootNotificationService: bootNotificationService as any,
        bootRepository: { updateByKey: vi.fn().mockResolvedValue({}) } as any,
        changeConfigurationRepository: { readAllByQuery: vi.fn().mockResolvedValue([]) } as any,
        locationRepository: makeLocationRepository() as any,
      });

      return { handler, cache, bootNotificationService };
    }

    const REQUEST = {
      chargePointVendor: 'Voltempo',
      chargePointModel: 'Hypercharger',
    } as OCPP1_6.BootNotificationRequest;

    it('reads the cached boot status under the tenant-scoped identifier', async () => {
      const { handler, cache } = makeHandler(OCPP1_6.BootNotificationResponseStatus.Accepted);

      await handler.handle(makeMessage(REQUEST, OCPPVersion.OCPP1_6));

      expect(cache.get).toHaveBeenCalledWith(BOOT_STATUS, IDENTIFIER);
    });

    it('writes the cached boot status under the tenant-scoped identifier', async () => {
      const { handler, cache } = makeHandler(OCPP1_6.BootNotificationResponseStatus.Rejected);

      await handler.handle(makeMessage(REQUEST, OCPPVersion.OCPP1_6));

      expect(cache.set).toHaveBeenCalledWith(
        BOOT_STATUS,
        OCPP1_6.BootNotificationResponseStatus.Rejected,
        IDENTIFIER,
      );
    });

    it('blacklists actions under the tenant-scoped identifier', async () => {
      const { handler, bootNotificationService } = makeHandler(
        OCPP1_6.BootNotificationResponseStatus.Rejected,
      );

      await handler.handle(makeMessage(REQUEST, OCPPVersion.OCPP1_6));

      expect(bootNotificationService.cacheOcpp16ChargerActionsPermissions).toHaveBeenCalledWith(
        IDENTIFIER,
        null,
        OCPP1_6.BootNotificationResponseStatus.Rejected,
      );
    });
  });

  describe('OCPP 2.0.1', () => {
    function makeHandler(status: OCPP2_0_1.RegistrationStatusEnumType) {
      const { logger } = createTestContainer();
      const cache = makeCache();
      const bootNotificationService = {
        createBootNotificationResponse: vi
          .fn()
          .mockResolvedValue({ status, currentTime: new Date().toISOString(), interval: 60 }),
        cacheChargerActionsPermissions: vi.fn().mockResolvedValue(undefined),
        updateBootConfig: vi.fn().mockResolvedValue({ id: 1, getBaseReportOnPending: false }),
      };

      const handler = new BootNotificationRequestOcpp2Handler({
        logger,
        ocppSender: makeMockOcppSender(),
        cache: cache as unknown as ICache,
        config: makeConfig(),
        bootNotificationService: bootNotificationService as any,
        configurationDeviceModelService: { updateDeviceModel: vi.fn() } as any,
        deviceModelRepository: {} as any,
        locationRepository: makeLocationRepository() as any,
      });

      return { handler, cache, bootNotificationService };
    }

    const REQUEST = {
      reason: OCPP2_0_1.BootReasonEnumType.PowerUp,
      chargingStation: { vendorName: 'Voltempo', model: 'Hypercharger' },
    } as OCPP2_0_1.BootNotificationRequest;

    it('reads the cached boot status under the tenant-scoped identifier', async () => {
      const { handler, cache } = makeHandler(RegistrationStatusEnum.Accepted);

      await handler.handle(makeMessage(REQUEST, OCPPVersion.OCPP2_0_1));

      expect(cache.get).toHaveBeenCalledWith(BOOT_STATUS, IDENTIFIER);
    });

    it('writes the cached boot status under the tenant-scoped identifier', async () => {
      const { handler, cache } = makeHandler(RegistrationStatusEnum.Rejected);

      await handler.handle(makeMessage(REQUEST, OCPPVersion.OCPP2_0_1));

      expect(cache.set).toHaveBeenCalledWith(
        BOOT_STATUS,
        RegistrationStatusEnum.Rejected,
        IDENTIFIER,
      );
    });

    it('blacklists actions under the tenant-scoped identifier', async () => {
      const { handler, bootNotificationService } = makeHandler(RegistrationStatusEnum.Rejected);

      await handler.handle(makeMessage(REQUEST, OCPPVersion.OCPP2_0_1));

      expect(bootNotificationService.cacheChargerActionsPermissions).toHaveBeenCalledWith(
        IDENTIFIER,
        null,
        RegistrationStatusEnum.Rejected,
      );
    });
  });
});
