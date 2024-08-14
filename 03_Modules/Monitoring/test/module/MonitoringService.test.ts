import { IVariableMonitoringRepository } from '@citrineos/data/dist/interfaces/repositories';
import { MonitoringService } from '../../src/module/MonitoringService';

describe('MonitoringService', () => {
  let mockVariableMonitoringRepository: jest.Mocked<IVariableMonitoringRepository>;
  let monitoringService: MonitoringService;

  beforeEach(() => {
    mockVariableMonitoringRepository = {
      rejectVariableMonitoringByIdAndStationId: jest.fn(),
    } as unknown as jest.Mocked<IVariableMonitoringRepository>;

    monitoringService = new MonitoringService(mockVariableMonitoringRepository);
  });
});
