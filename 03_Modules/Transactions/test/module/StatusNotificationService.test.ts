import {
  Component,
  IDeviceModelRepository,
  ILocationRepository,
  StatusNotification,
} from '@citrineos/data';
import { CrudRepository, DEFAULT_TENANT_ID } from '@citrineos/base';
import { StatusNotificationService } from '../../src/module/StatusNotificationService';
import {
  aOcpp16StatusNotificationRequest,
  aStatusNotification,
  aStatusNotificationRequest,
} from '../providers/StatusNotification';
import {
  aChargingStation,
  aComponent,
  anEvse,
  aVariable,
  MOCK_STATION_ID,
} from '../providers/DeviceModelProvider';

describe('StatusNotificationService', () => {
  let statusNotificationService: StatusNotificationService;
  let componentRepository: jest.Mocked<CrudRepository<Component>>;
  let deviceModelRepository: jest.Mocked<IDeviceModelRepository>;
  let locationRepository: jest.Mocked<ILocationRepository>;

  beforeEach(() => {
    componentRepository = {
      readOnlyOneByQuery: jest.fn(),
    } as unknown as jest.Mocked<CrudRepository<Component>>;

    deviceModelRepository = {
      createOrUpdateDeviceModelByStationId: jest.fn(),
    } as unknown as jest.Mocked<IDeviceModelRepository>;

    locationRepository = {
      addStatusNotificationToChargingStation: jest.fn(),
      readChargingStationByStationId: jest.fn(),
      createOrUpdateConnector: jest.fn(),
    } as unknown as jest.Mocked<ILocationRepository>;

    statusNotificationService = new StatusNotificationService(
      componentRepository,
      deviceModelRepository,
      locationRepository,
    );
  });

  it('should save StatusNotification for Charging Station because Charging Station exists', async () => {
    locationRepository.readChargingStationByStationId.mockResolvedValue(aChargingStation());
    jest.spyOn(StatusNotification, 'build').mockImplementation(() => {
      return aStatusNotification();
    });

    await statusNotificationService.processStatusNotification(
      DEFAULT_TENANT_ID,
      MOCK_STATION_ID,
      aStatusNotificationRequest(),
    );

    expect(locationRepository.addStatusNotificationToChargingStation).toHaveBeenCalled();
  });

  it('should not save StatusNotification for Charging Station because Charging Station does not exist', async () => {
    locationRepository.readChargingStationByStationId.mockResolvedValue(undefined);

    await statusNotificationService.processStatusNotification(
      DEFAULT_TENANT_ID,
      MOCK_STATION_ID,
      aStatusNotificationRequest(),
    );

    expect(locationRepository.addStatusNotificationToChargingStation).not.toHaveBeenCalled();
  });

  it('should save Component and Variable ReportData because Component and Variable exist', async () => {
    componentRepository.readOnlyOneByQuery.mockResolvedValue(
      aComponent((c) => {
        c.name = 'Connector';
        c.evse = anEvse();
        c.variables = [
          aVariable((v) => {
            v.name = 'AvailabilityState';
          }),
        ];
      }),
    );

    await statusNotificationService.processStatusNotification(
      DEFAULT_TENANT_ID,
      MOCK_STATION_ID,
      aStatusNotificationRequest(),
    );

    expect(deviceModelRepository.createOrUpdateDeviceModelByStationId).toHaveBeenCalled();
  });

  describe('Component or Variable does not exist', () => {
    it('should not save Component and Variable ReportData because Component does not exist', async () => {
      componentRepository.readOnlyOneByQuery.mockResolvedValue(undefined);

      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest(),
      );

      expect(deviceModelRepository.createOrUpdateDeviceModelByStationId).not.toHaveBeenCalled();
    });

    it('should not save Component and Variable ReportData because Variable does not exist', async () => {
      componentRepository.readOnlyOneByQuery.mockResolvedValue(aComponent());

      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest(),
      );

      expect(deviceModelRepository.createOrUpdateDeviceModelByStationId).not.toHaveBeenCalled();
    });
  });

  describe('Test process OCPP 1.6 StatusNotification', () => {
    it('should save StatusNotification and connector when Charging Station exists', async () => {
      locationRepository.readChargingStationByStationId.mockResolvedValue(aChargingStation());
      jest.spyOn(StatusNotification, 'build').mockImplementation(() => {
        return aStatusNotification();
      });

      await statusNotificationService.processOcpp16StatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aOcpp16StatusNotificationRequest(),
      );

      expect(locationRepository.addStatusNotificationToChargingStation).toHaveBeenCalled();
      expect(locationRepository.createOrUpdateConnector).toHaveBeenCalled();
    });

    it('should not save StatusNotification or connector when Charging Station does not exist', async () => {
      componentRepository.readOnlyOneByQuery.mockResolvedValue(aComponent());

      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest(),
      );

      expect(locationRepository.addStatusNotificationToChargingStation).not.toHaveBeenCalled();
      expect(locationRepository.createOrUpdateConnector).not.toHaveBeenCalled();
    });
  });
});
