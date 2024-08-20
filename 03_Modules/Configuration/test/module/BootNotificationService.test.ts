import { Boot, IBootRepository } from '@citrineos/data';
import { BootNotificationService } from '../../src/module/BootNotificationService';
import {
  ICache,
  RegistrationStatusEnumType,
  SystemConfig,
} from '@citrineos/base';
import { aValidBootConfig } from '../providers/BootConfigProvider';
import { aMessageConfirmation, MOCK_REQUEST_ID } from '../providers/SendCall';

type Configuration = SystemConfig['modules']['configuration'];

describe('BootService', () => {
  let mockBootRepository: jest.Mocked<IBootRepository>;
  let mockCache: jest.Mocked<ICache>;
  let mockConfig: jest.Mocked<Configuration>;
  const mockMaxCachingSeconds = 10;
  let bootService: BootNotificationService;
  const MOCK_STATION_ID = 'Station01';

  beforeEach(() => {
    mockBootRepository = {
      readByKey: jest.fn(),
    } as unknown as jest.Mocked<IBootRepository>;

    mockCache = {
      onChange: jest.fn(),
      remove: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<ICache>;

    mockConfig = {
      bootRetryInterval: 0,
      bootWithRejectedVariables: false,
      endpointPrefix: '',
      heartbeatInterval: 0,
      unknownChargerStatus: RegistrationStatusEnumType.Rejected,
      getBaseReportOnPending: false,
      autoAccept: false,
    };

    bootService = new BootNotificationService(
      mockBootRepository,
      mockCache,
      mockConfig,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('determineBootStatus', () => {
    const runDetermineBootStatusTest = (
      bootConfig: Boot | undefined,
      expectedStatus: RegistrationStatusEnumType,
    ) => {
      const result = bootService.determineBootStatus(bootConfig);
      expect(result).toBe(expectedStatus);
    };

    it('should return unknownChargerStatus if bootConfig is undefined', () => {
      runDetermineBootStatusTest(
        undefined,
        RegistrationStatusEnumType.Rejected,
      );
    });

    it.each([
      {
        bootConfigStatus: RegistrationStatusEnumType.Accepted,
        expectedStatus: RegistrationStatusEnumType.Accepted,
      },
      {
        bootConfigStatus: RegistrationStatusEnumType.Rejected,
        expectedStatus: RegistrationStatusEnumType.Rejected,
      },
    ])(
      'should return bootConfig status if not pending',
      ({ bootConfigStatus, expectedStatus }) => {
        const bootConfig = aValidBootConfig(
          (item: Boot) => (item.status = bootConfigStatus),
        );
        runDetermineBootStatusTest(bootConfig, expectedStatus);
      },
    );

    it('should return Pending status when bootConfig.status is pending and no actions are needed', () => {
      const bootConfig = aValidBootConfig(
        (item: Boot) => (item.status = RegistrationStatusEnumType.Pending),
      );
      runDetermineBootStatusTest(
        bootConfig,
        RegistrationStatusEnumType.Pending,
      );
    });

    it('should return Accepted status when bootConfig.status is pending and no actions are needed but autoAccept is true', () => {
      const bootConfig = aValidBootConfig(
        (item: Boot) => (item.getBaseReportOnPending = false),
      );

      jest.replaceProperty(mockConfig, 'autoAccept', true);

      runDetermineBootStatusTest(
        bootConfig,
        RegistrationStatusEnumType.Accepted,
      );
    });

    it('should return Pending status when bootConfig.status is pending and getBaseReportOnPending is true', () => {
      const bootConfig = aValidBootConfig(
        (item: Boot) => (item.getBaseReportOnPending = true),
      );
      runDetermineBootStatusTest(
        bootConfig,
        RegistrationStatusEnumType.Pending,
      );
    });

    it('should return Pending status when bootConfig.status is pending and pendingBootSetVariables is not empty', () => {
      const bootConfig = aValidBootConfig(
        (item: Boot) => (item.pendingBootSetVariables = [{}] as any),
      );
      runDetermineBootStatusTest(
        bootConfig,
        RegistrationStatusEnumType.Pending,
      );
    });

    it('should return Accepted status when bootConfig.status is pending, no actions are needed, and autoAccept is true', () => {
      const bootConfig = aValidBootConfig();

      jest.replaceProperty(mockConfig, 'autoAccept', true);

      runDetermineBootStatusTest(
        bootConfig,
        RegistrationStatusEnumType.Accepted,
      );
    });
  });

  describe('cacheChargerActionsPermissions', () => {
    it('should whitelist charger actions because boot was accepted and charger actions were previously blacklisted', async () => {
      await bootService.cacheChargerActionsPermissions(
        MOCK_STATION_ID,
        RegistrationStatusEnumType.Pending,
        RegistrationStatusEnumType.Accepted,
      );

      expect(mockCache.remove).toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should blacklist charger actions because boot was rejected and charger actions were not previously cached', async () => {
      await bootService.cacheChargerActionsPermissions(
        MOCK_STATION_ID,
        null,
        RegistrationStatusEnumType.Rejected,
      );

      expect(mockCache.remove).not.toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should do nothing because the boot was accepted but no charger actions were cached', async () => {
      await bootService.cacheChargerActionsPermissions(
        MOCK_STATION_ID,
        null,
        RegistrationStatusEnumType.Accepted,
      );

      expect(mockCache.remove).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should do nothing because the boot was not accepted and charger actions were already blacklisted', async () => {
      await bootService.cacheChargerActionsPermissions(
        MOCK_STATION_ID,
        RegistrationStatusEnumType.Rejected,
        RegistrationStatusEnumType.Rejected,
      );

      expect(mockCache.remove).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
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
      mockCache.onChange
        .mockResolvedValueOnce('ongoing')
        .mockResolvedValueOnce(null);

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

    it('should not throw because getBaseReport process completes', () => {
      mockCache.onChange
        .mockResolvedValueOnce('ongoing')
        .mockResolvedValueOnce('complete');

      expect(
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
