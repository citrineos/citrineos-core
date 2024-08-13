import { Boot, IBootRepository } from '@citrineos/data';
import { BootNotificationService } from '../../src/module/BootNotificationService';
import {
  ICache,
  RegistrationStatusEnumType,
  SystemConfig,
} from '@citrineos/base';
import { aValidBootConfig, aValidConfiguration } from '../providers/BootConfig';

type Configuration = SystemConfig['modules']['configuration'];

describe('BootService', () => {
  let mockBootRepository: jest.Mocked<IBootRepository>;
  let mockCache: jest.Mocked<ICache>;
  let mockConfig: jest.Mocked<Configuration>;
  const mockMaxCachingSeconds = 10;
  let bootService: BootNotificationService;

  beforeEach(() => {
    mockBootRepository = {
      readByKey: jest.fn(),
    } as unknown as jest.Mocked<IBootRepository>;

    mockCache = {} as jest.Mocked<ICache>;

    mockConfig = {
      bootRetryInterval: 0,
      bootWithRejectedVariables: false,
      endpointPrefix: '',
      heartbeatInterval: 0,
      unknownChargerStatus: RegistrationStatusEnumType.Rejected,
      getBaseReportOnPending: false,
      autoAccept: false,
    }

    bootService = new BootNotificationService(mockBootRepository, mockCache, mockConfig, mockMaxCachingSeconds);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  })

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
        runDetermineBootStatusTest(
          bootConfig,
          expectedStatus,
        );
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
});
