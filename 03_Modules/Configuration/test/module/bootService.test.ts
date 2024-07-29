import { Boot, IBootRepository } from '@citrineos/data';
import { BootService } from '../../src/module/bootService';
import { RegistrationStatusEnumType } from '@citrineos/base';
import { aValidBootConfig, aValidConfiguration } from '../providers/bootConfig';

describe('BootService', () => {
  let mockBootRepository: jest.Mocked<IBootRepository>;
  let bootService: BootService;

  beforeEach(() => {
    mockBootRepository = {
      readByKey: jest.fn(),
    } as unknown as jest.Mocked<IBootRepository>;
    bootService = new BootService(mockBootRepository);
  });

  const runDetermineBootStatusTest = (
    bootConfig: Boot | undefined,
    configuration: any,
    expectedStatus: RegistrationStatusEnumType,
  ) => {
    const result = bootService.determineBootStatus(bootConfig, configuration);
    expect(result).toBe(expectedStatus);
  };

  describe('determineBootStatus', () => {
    it('should return unknownChargerStatus if bootConfig is undefined', () => {
      runDetermineBootStatusTest(
        undefined,
        aValidConfiguration(),
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
          (item) => (item.status = bootConfigStatus),
        );
        runDetermineBootStatusTest(
          bootConfig,
          aValidConfiguration(),
          expectedStatus,
        );
      },
    );

    it('should return Pending status when bootConfig.status is pending and no actions are needed', () => {
      const bootConfig = aValidBootConfig(
        (item) => (item.status = RegistrationStatusEnumType.Pending),
      );
      runDetermineBootStatusTest(
        bootConfig,
        aValidConfiguration(),
        RegistrationStatusEnumType.Pending,
      );
    });

    it('should return Accepted status when bootConfig.status is pending and no actions are needed but autoAccept is true', () => {
      const bootConfig = aValidBootConfig(
        (item) => (item.getBaseReportOnPending = false),
      );
      const configWithAutoAccept = aValidConfiguration(
        (item) => (item.autoAccept = true),
      );
      runDetermineBootStatusTest(
        bootConfig,
        configWithAutoAccept,
        RegistrationStatusEnumType.Accepted,
      );
    });

    it('should return Pending status when bootConfig.status is pending and getBaseReportOnPending is true', () => {
      const bootConfig = aValidBootConfig(
        (item) => (item.getBaseReportOnPending = true),
      );
      runDetermineBootStatusTest(
        bootConfig,
        aValidConfiguration(),
        RegistrationStatusEnumType.Pending,
      );
    });

    it('should return Pending status when bootConfig.status is pending and pendingBootSetVariables is not empty', () => {
      const bootConfig = aValidBootConfig(
        (item) => (item.pendingBootSetVariables = [{}] as any),
      );
      runDetermineBootStatusTest(
        bootConfig,
        aValidConfiguration(),
        RegistrationStatusEnumType.Pending,
      );
    });

    it('should return Accepted status when bootConfig.status is pending, no actions are needed, and autoAccept is true', () => {
      const bootConfig = aValidBootConfig();
      const configWithAutoAccept = aValidConfiguration(
        (item) => (item.autoAccept = true),
      );
      runDetermineBootStatusTest(
        bootConfig,
        configWithAutoAccept,
        RegistrationStatusEnumType.Accepted,
      );
    });
  });
});
