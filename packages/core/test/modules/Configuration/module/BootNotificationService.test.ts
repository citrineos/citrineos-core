// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { Boot, IBootRepository } from '@citrineos/core';
import { BootNotificationService } from '@modules/Configuration/src/module/BootNotificationService.js';
import { BOOT_STATUS, createIdentifier, DEFAULT_TENANT_ID, ICache } from '@citrineos/base';
import { OCPP1_6, OCPP2_0_1, OCPP_CallAction, SystemConfig } from '@citrineos/types';
import { MemoryCache } from '@util/cache/memory.js';
import { aValidBootConfig } from '../providers/BootConfigProvider.js';
import { aMessageConfirmation, MOCK_REQUEST_ID } from '../providers/SendCall.js';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

type Configuration = SystemConfig['modules']['configuration'];

describe('BootService', () => {
  const { container } = createTestContainer();
  let mockBootRepository: Mocked<IBootRepository>;
  let mockCache: Mocked<ICache>;
  let mockConfig: Mocked<Configuration>;
  const mockMaxCachingSeconds = 10;
  let bootService: BootNotificationService;
  const MOCK_STATION_ID = 'Station01';

  beforeEach(() => {
    mockBootRepository = {
      readByKey: vi.fn(),
    } as unknown as Mocked<IBootRepository>;

    mockCache = {
      onChange: vi.fn(),
      remove: vi.fn(),
      set: vi.fn(),
    } as unknown as Mocked<ICache>;

    mockConfig = {
      bootRetryInterval: 0,
      endpointPrefix: '',
      heartbeatInterval: 0,
      requests: [],
      responses: [],
      ocpp2_0_1: {
        unknownChargerStatus: OCPP2_0_1.RegistrationStatusEnumType.Rejected,
        getBaseReportOnPending: false,
        bootWithRejectedVariables: false,
        autoAccept: false,
      },
      ocpp1_6: {
        unknownChargerStatus: OCPP1_6.BootNotificationResponseStatus.Rejected,
      },
    };

    bootService = getTestInstance(container, BootNotificationService, {
      bootRepository: mockBootRepository,
      cache: mockCache,
      config: mockConfig,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('determineBootStatus', () => {
    const runDetermineBootStatusTest = (
      bootConfig: Boot | undefined,
      expectedStatus: OCPP2_0_1.RegistrationStatusEnumType,
    ) => {
      const result = bootService.determineBootStatus(bootConfig);
      expect(result).toBe(expectedStatus);
    };

    it('should return unknownChargerStatus if bootConfig is undefined', () => {
      runDetermineBootStatusTest(undefined, OCPP2_0_1.RegistrationStatusEnumType.Rejected);
    });

    it.each([
      {
        bootConfigStatus: OCPP2_0_1.RegistrationStatusEnumType.Accepted,
        expectedStatus: OCPP2_0_1.RegistrationStatusEnumType.Accepted,
      },
      {
        bootConfigStatus: OCPP2_0_1.RegistrationStatusEnumType.Rejected,
        expectedStatus: OCPP2_0_1.RegistrationStatusEnumType.Rejected,
      },
    ])('should return bootConfig status if not pending', ({ bootConfigStatus, expectedStatus }) => {
      const bootConfig = aValidBootConfig((item: Boot) => (item.status = bootConfigStatus));
      runDetermineBootStatusTest(bootConfig, expectedStatus);
    });

    it('should return Pending status when bootConfig.status is pending and no actions are needed', () => {
      const bootConfig = aValidBootConfig(
        (item: Boot) => (item.status = OCPP2_0_1.RegistrationStatusEnumType.Pending),
      );
      runDetermineBootStatusTest(bootConfig, OCPP2_0_1.RegistrationStatusEnumType.Pending);
    });

    it('should return Accepted status when bootConfig.status is pending and no actions are needed but autoAccept is true', () => {
      const bootConfig = aValidBootConfig((item: Boot) => (item.getBaseReportOnPending = false));

      if (mockConfig && mockConfig.ocpp2_0_1) {
        mockConfig.ocpp2_0_1.autoAccept = true;
      }

      runDetermineBootStatusTest(bootConfig, OCPP2_0_1.RegistrationStatusEnumType.Accepted);
    });

    it('should return Pending status when bootConfig.status is pending and getBaseReportOnPending is true', () => {
      const bootConfig = aValidBootConfig((item: Boot) => (item.getBaseReportOnPending = true));
      runDetermineBootStatusTest(bootConfig, OCPP2_0_1.RegistrationStatusEnumType.Pending);
    });

    it('should return Pending status when bootConfig.status is pending and pendingBootSetVariables is not empty', () => {
      const bootConfig = aValidBootConfig(
        (item: Boot) => (item.pendingBootSetVariables = [{}] as any),
      );
      runDetermineBootStatusTest(bootConfig, OCPP2_0_1.RegistrationStatusEnumType.Pending);
    });

    it('should return Accepted status when bootConfig.status is pending, no actions are needed, and autoAccept is true', () => {
      const bootConfig = aValidBootConfig();

      if (mockConfig && mockConfig.ocpp2_0_1) {
        mockConfig.ocpp2_0_1.autoAccept = true;
      }

      runDetermineBootStatusTest(bootConfig, OCPP2_0_1.RegistrationStatusEnumType.Accepted);
    });
  });

  describe('cacheChargerActionsPermissions', () => {
    it('should whitelist charger actions because boot was accepted and charger actions were previously blacklisted', async () => {
      await bootService.cacheChargerActionsPermissions(
        MOCK_STATION_ID,
        OCPP2_0_1.RegistrationStatusEnumType.Pending,
        OCPP2_0_1.RegistrationStatusEnumType.Accepted,
      );

      expect(mockCache.remove).toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should blacklist charger actions because boot was rejected and charger actions were not previously cached', async () => {
      await bootService.cacheChargerActionsPermissions(
        MOCK_STATION_ID,
        null,
        OCPP2_0_1.RegistrationStatusEnumType.Rejected,
      );

      expect(mockCache.remove).not.toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should do nothing because the boot was accepted but no charger actions were cached', async () => {
      await bootService.cacheChargerActionsPermissions(
        MOCK_STATION_ID,
        null,
        OCPP2_0_1.RegistrationStatusEnumType.Accepted,
      );

      expect(mockCache.remove).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should do nothing because the boot was not accepted and charger actions were already blacklisted', async () => {
      await bootService.cacheChargerActionsPermissions(
        MOCK_STATION_ID,
        OCPP2_0_1.RegistrationStatusEnumType.Rejected,
        OCPP2_0_1.RegistrationStatusEnumType.Rejected,
      );

      expect(mockCache.remove).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  describe('cache namespacing agrees with the router', () => {
    // MessageRouterImpl gates inbound Calls on `cache.exists(action, identifier)` and outbound
    // Calls on `cache.get(BOOT_STATUS, identifier)`, where identifier is
    // `createIdentifier(tenantId, ocppConnectionName)`. Anything written under a different
    // namespace is simply never read, so the blacklist and the boot gate do nothing.
    const IDENTIFIER = createIdentifier(DEFAULT_TENANT_ID, MOCK_STATION_ID);

    let realCache: ICache;
    let service: BootNotificationService;

    beforeEach(() => {
      realCache = new MemoryCache();
      service = getTestInstance(container, BootNotificationService, {
        bootRepository: mockBootRepository,
        cache: realCache,
        config: mockConfig,
      });
    });

    it('blacklists OCPP 2.0.1 actions where the router looks for them', async () => {
      await service.cacheChargerActionsPermissions(
        IDENTIFIER,
        null,
        OCPP2_0_1.RegistrationStatusEnumType.Rejected,
      );

      await expect(realCache.exists(OCPP_CallAction.StatusNotification, IDENTIFIER)).resolves.toBe(
        true,
      );
    });

    it('blacklists OCPP 1.6 actions where the router looks for them', async () => {
      await service.cacheOcpp16ChargerActionsPermissions(
        IDENTIFIER,
        null,
        OCPP1_6.BootNotificationResponseStatus.Rejected,
      );

      await expect(realCache.exists(OCPP_CallAction.StatusNotification, IDENTIFIER)).resolves.toBe(
        true,
      );
    });

    it('leaves BootNotification itself un-blacklisted', async () => {
      await service.cacheOcpp16ChargerActionsPermissions(
        IDENTIFIER,
        null,
        OCPP1_6.BootNotificationResponseStatus.Rejected,
      );

      await expect(realCache.exists(OCPP_CallAction.BootNotification, IDENTIFIER)).resolves.toBe(
        false,
      );
    });

    it('clears the OCPP 2.0.1 blacklist and boot status on an accepted boot', async () => {
      await service.cacheChargerActionsPermissions(
        IDENTIFIER,
        null,
        OCPP2_0_1.RegistrationStatusEnumType.Rejected,
      );
      await realCache.set(BOOT_STATUS, OCPP2_0_1.RegistrationStatusEnumType.Rejected, IDENTIFIER);

      await service.cacheChargerActionsPermissions(
        IDENTIFIER,
        OCPP2_0_1.RegistrationStatusEnumType.Rejected,
        OCPP2_0_1.RegistrationStatusEnumType.Accepted,
      );

      await expect(realCache.exists(OCPP_CallAction.StatusNotification, IDENTIFIER)).resolves.toBe(
        false,
      );
      await expect(realCache.get(BOOT_STATUS, IDENTIFIER)).resolves.toBeNull();
    });

    it('clears the OCPP 1.6 boot status on an accepted boot', async () => {
      // The 1.6 un-blacklist loop itself is separately broken (it destructures each action
      // name as an array) and is fixed by #865, so this only covers the boot status.
      await realCache.set(BOOT_STATUS, OCPP1_6.BootNotificationResponseStatus.Rejected, IDENTIFIER);

      await service.cacheOcpp16ChargerActionsPermissions(
        IDENTIFIER,
        OCPP1_6.BootNotificationResponseStatus.Rejected,
        OCPP1_6.BootNotificationResponseStatus.Accepted,
      );

      await expect(realCache.get(BOOT_STATUS, IDENTIFIER)).resolves.toBeNull();
    });

    it('does not blacklist a same-named station belonging to another tenant', async () => {
      await service.cacheChargerActionsPermissions(
        IDENTIFIER,
        null,
        OCPP2_0_1.RegistrationStatusEnumType.Rejected,
      );

      const otherTenant = createIdentifier(DEFAULT_TENANT_ID + 1, MOCK_STATION_ID);
      await expect(realCache.exists(OCPP_CallAction.StatusNotification, otherTenant)).resolves.toBe(
        false,
      );
    });
  });

  describe('confirmGetBaseReportSuccess', () => {
    it('should throw because getBaseReport was not successful', async () => {
      const unsuccessfulConfirmation = aMessageConfirmation((mc) => {
        mc.success = false;
      });

      await expect(
        async () =>
          await bootService.confirmGetBaseReportSuccess(
            MOCK_STATION_ID,
            MOCK_REQUEST_ID.toString(),
            unsuccessfulConfirmation,
            mockMaxCachingSeconds,
          ),
      ).rejects.toThrow();
    });

    it('should throw because getBaseReport process never completes', async () => {
      mockCache.onChange.mockResolvedValueOnce('ongoing').mockResolvedValueOnce(null);

      await expect(
        async () =>
          await bootService.confirmGetBaseReportSuccess(
            MOCK_STATION_ID,
            MOCK_REQUEST_ID.toString(),
            aMessageConfirmation(),
            mockMaxCachingSeconds,
          ),
      ).rejects.toThrow();
    });

    it('should not throw because getBaseReport process completes', async () => {
      mockCache.onChange.mockResolvedValueOnce('ongoing').mockResolvedValueOnce('complete');

      await expect(
        bootService.confirmGetBaseReportSuccess(
          MOCK_STATION_ID,
          MOCK_REQUEST_ID.toString(),
          aMessageConfirmation(),
          mockMaxCachingSeconds,
        ),
      ).resolves.not.toThrow();
    });
  });
});
