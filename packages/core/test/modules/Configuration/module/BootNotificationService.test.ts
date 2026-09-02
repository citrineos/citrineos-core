// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { CacheNamespace, createIdentifier, DEFAULT_TENANT_ID, ICache } from '@citrineos/base';
import { Boot, IBootRepository, MemoryCache } from '@citrineos/core';
import { OCPP1_6, OCPP2_0_1, OCPP_CallAction, SystemConfig } from '@citrineos/types';
import { BootNotificationService } from '@modules/Configuration/src/module/BootNotificationService.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { aValidBootConfig } from '../providers/BootConfigProvider.js';
import { aMessageConfirmation, MOCK_REQUEST_ID } from '../providers/SendCall.js';

type Configuration = SystemConfig['ocpp'];

describe('BootService', () => {
  const { container } = createTestContainer();
  let mockBootRepository: Mocked<IBootRepository>;
  let mockCache: Mocked<ICache>;
  let mockConfig: Mocked<Configuration>;
  const mockMaxCachingSeconds = 10;
  let bootService: BootNotificationService;
  const MOCK_STATION_ID = 'Station01';
  const MOCK_IDENTIFIER = createIdentifier(DEFAULT_TENANT_ID, MOCK_STATION_ID);

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
      heartbeatInterval: 0,
      unknownChargerStatus: OCPP2_0_1.RegistrationStatusEnumType.Rejected,
      getBaseReportOnPending: false,
      bootWithRejectedVariables: false,
      autoAccept: false,
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

      mockConfig.autoAccept = true;

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

      mockConfig.autoAccept = true;

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

    // B01.FR.10 / B02.FR.09 / B03.FR.07: while a station's boot is Rejected or Pending, anything it
    // sends other than BootNotification (or a triggered message) is answered SecurityError. The
    // blacklist is what enforces that, so it has to cover every action the station can send -
    // including the ones only OCPP 2.1 defines.
    it.each([OCPP_CallAction.NotifySettlement, OCPP_CallAction.VatNumberValidation])(
      'blacklists the OCPP 2.1 action %s',
      async (action) => {
        await bootService.cacheChargerActionsPermissions(
          MOCK_STATION_ID,
          null,
          OCPP2_0_1.RegistrationStatusEnumType.Rejected,
        );

        expect(mockCache.set).toHaveBeenCalledWith(action, 'blacklisted', MOCK_STATION_ID);
      },
    );

    it('whitelists the OCPP 2.1 actions again once the boot is accepted', async () => {
      await bootService.cacheChargerActionsPermissions(
        MOCK_STATION_ID,
        OCPP2_0_1.RegistrationStatusEnumType.Pending,
        OCPP2_0_1.RegistrationStatusEnumType.Accepted,
      );

      expect(mockCache.remove).toHaveBeenCalledWith(
        OCPP_CallAction.NotifySettlement,
        MOCK_STATION_ID,
      );
      expect(mockCache.remove).toHaveBeenCalledWith(
        OCPP_CallAction.VatNumberValidation,
        MOCK_STATION_ID,
      );
    });

    it('never blacklists BootNotification itself', async () => {
      await bootService.cacheChargerActionsPermissions(
        MOCK_STATION_ID,
        null,
        OCPP2_0_1.RegistrationStatusEnumType.Rejected,
      );

      expect(mockCache.set).not.toHaveBeenCalledWith(
        OCPP_CallAction.BootNotification,
        'blacklisted',
        MOCK_STATION_ID,
      );
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
      await realCache.set(
        CacheNamespace.BootStatus,
        OCPP2_0_1.RegistrationStatusEnumType.Rejected,
        IDENTIFIER,
      );

      await service.cacheChargerActionsPermissions(
        IDENTIFIER,
        OCPP2_0_1.RegistrationStatusEnumType.Rejected,
        OCPP2_0_1.RegistrationStatusEnumType.Accepted,
      );

      await expect(realCache.exists(OCPP_CallAction.StatusNotification, IDENTIFIER)).resolves.toBe(
        false,
      );
      await expect(realCache.get(CacheNamespace.BootStatus, IDENTIFIER)).resolves.toBeNull();
    });

    it('clears the OCPP 1.6 boot status on an accepted boot', async () => {
      // The 1.6 un-blacklist loop itself is separately broken (it destructures each action
      // name as an array) and is fixed by #865, so this only covers the boot status.
      await realCache.set(
        CacheNamespace.BootStatus,
        OCPP1_6.BootNotificationResponseStatus.Rejected,
        IDENTIFIER,
      );

      await service.cacheOcpp16ChargerActionsPermissions(
        IDENTIFIER,
        OCPP1_6.BootNotificationResponseStatus.Rejected,
        OCPP1_6.BootNotificationResponseStatus.Accepted,
      );

      await expect(realCache.get(CacheNamespace.BootStatus, IDENTIFIER)).resolves.toBeNull();
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

  describe('createGetBaseReportRequest', () => {
    it('marks the request ongoing under the tenant-scoped identifier', async () => {
      // The request id is a hard-coded 0, so with the bare station name as the namespace two
      // tenants that both have a station of that name share one cache entry.
      await bootService.createGetBaseReportRequest(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        mockMaxCachingSeconds,
      );

      expect(mockCache.set).toHaveBeenCalledWith(
        '0',
        'ongoing',
        MOCK_IDENTIFIER,
        mockMaxCachingSeconds,
      );
    });
  });

  describe('confirmGetBaseReportSuccess', () => {
    it('waits on the tenant-scoped identifier', async () => {
      mockCache.onChange.mockResolvedValueOnce('complete');

      await bootService.confirmGetBaseReportSuccess(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        MOCK_REQUEST_ID.toString(),
        aMessageConfirmation(),
        mockMaxCachingSeconds,
      );

      expect(mockCache.onChange).toHaveBeenCalledWith(
        MOCK_REQUEST_ID.toString(),
        mockMaxCachingSeconds,
        MOCK_IDENTIFIER,
      );
    });

    it('should throw because getBaseReport was not successful', async () => {
      const unsuccessfulConfirmation = aMessageConfirmation((mc) => {
        mc.success = false;
      });

      await expect(
        async () =>
          await bootService.confirmGetBaseReportSuccess(
            DEFAULT_TENANT_ID,
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
            DEFAULT_TENANT_ID,
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
          DEFAULT_TENANT_ID,
          MOCK_STATION_ID,
          MOCK_REQUEST_ID.toString(),
          aMessageConfirmation(),
          mockMaxCachingSeconds,
        ),
      ).resolves.not.toThrow();
    });
  });
});
