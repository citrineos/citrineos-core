import { IVariableMonitoringRepository } from '@citrineos/data/dist/interfaces/repositories';
import { MonitoringService } from '../../src/module/MonitoringService';
import {
  ClearMonitoringResultType,
  ClearMonitoringStatusEnumType,
} from '@citrineos/base';
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
        ClearMonitoringResultType,
        ...ClearMonitoringResultType[],
      ] = [
        aClearMonitoringResult(),
        aClearMonitoringResult(
          (cmr) => (cmr.status = ClearMonitoringStatusEnumType.NotFound),
        ),
      ];

      await monitoringService.processClearMonitoringResult(
        'stationId',
        monitoringResults,
      );

      expect(
        mockVariableMonitoringRepository.rejectVariableMonitoringByIdAndStationId,
      ).toHaveBeenCalledTimes(monitoringResults.length);
    });

    it('should not reject variable monitoring because  clear monitoring result status is Rejected (so neither Accepted nor NotFound)', async () => {
      const monitoringResults: [
        ClearMonitoringResultType,
        ...ClearMonitoringResultType[],
      ] = [
        aClearMonitoringResult(
          (cmr) => (cmr.status = ClearMonitoringStatusEnumType.Rejected),
        ),
      ];

      await monitoringService.processClearMonitoringResult(
        'stationId',
        monitoringResults,
      );

      expect(
        mockVariableMonitoringRepository.rejectVariableMonitoringByIdAndStationId,
      ).not.toHaveBeenCalled();
    });
  });
});
