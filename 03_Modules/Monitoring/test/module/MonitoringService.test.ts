import { IVariableMonitoringRepository } from '@citrineos/data';
import { MonitoringService } from '../../src/module/MonitoringService';
import { DEFAULT_TENANT_ID, OCPP2_0_1 } from '@citrineos/base';
import { aClearMonitoringResult } from '../providers/Monitoring';

describe('MonitoringService', () => {
  let mockVariableMonitoringRepository: jest.Mocked<IVariableMonitoringRepository>;
  let monitoringService: MonitoringService;

  beforeEach(() => {
    mockVariableMonitoringRepository = {
      rejectVariableMonitoringByIdAndStationId: jest.fn(),
    } as unknown as jest.Mocked<IVariableMonitoringRepository>;

    monitoringService = new MonitoringService(mockVariableMonitoringRepository);
  });

  describe('processClearMonitoringResult', () => {
    it('should reject variable monitoring because clear monitoring result status is either Accepted or NotFound', async () => {
      const monitoringResults: [
        OCPP2_0_1.ClearMonitoringResultType,
        ...OCPP2_0_1.ClearMonitoringResultType[],
      ] = [
        aClearMonitoringResult(),
        aClearMonitoringResult(
          (cmr) => (cmr.status = OCPP2_0_1.ClearMonitoringStatusEnumType.NotFound),
        ),
      ];

      await monitoringService.processClearMonitoringResult(
        DEFAULT_TENANT_ID,
        'stationId',
        monitoringResults,
      );

      expect(
        mockVariableMonitoringRepository.rejectVariableMonitoringByIdAndStationId,
      ).toHaveBeenCalledTimes(monitoringResults.length);
    });

    it('should not reject variable monitoring because  clear monitoring result status is Rejected (so neither Accepted nor NotFound)', async () => {
      const monitoringResults: [
        OCPP2_0_1.ClearMonitoringResultType,
        ...OCPP2_0_1.ClearMonitoringResultType[],
      ] = [
        aClearMonitoringResult(
          (cmr) => (cmr.status = OCPP2_0_1.ClearMonitoringStatusEnumType.Rejected),
        ),
      ];

      await monitoringService.processClearMonitoringResult(
        DEFAULT_TENANT_ID,
        'stationId',
        monitoringResults,
      );

      expect(
        mockVariableMonitoringRepository.rejectVariableMonitoringByIdAndStationId,
      ).not.toHaveBeenCalled();
    });
  });
});
