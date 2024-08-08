import {
  Component,
  IDeviceModelRepository,
  ILocationRepository,
} from '@citrineos/data';
import { CrudRepository } from '@citrineos/base';
import { StatusNotificationService } from '../../src/module/StatusNotificationService';
import { aStatusNotificationRequest } from '../providers/StatusNotification';
import {
  aChargingStation,
  aComponent,
  anEvse,
  aVariable,
  MOCK_STATION_ID,
} from '../providers/DeviceModel';

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
    } as unknown as jest.Mocked<ILocationRepository>;

    statusNotificationService = new StatusNotificationService(
      componentRepository,
      deviceModelRepository,
      locationRepository,
    );
  });

  it('should save StatusNotification to Charging Station because Charging Station exists', async () => {
    locationRepository.readChargingStationByStationId.mockResolvedValue(
      aChargingStation(),
    );

    await statusNotificationService.processStatusNotification(
      MOCK_STATION_ID,
      aStatusNotificationRequest(),
    );

    expect(
      locationRepository.addStatusNotificationToChargingStation,
    ).toHaveBeenCalled();
  });

  it('should not save StatusNotification to Charging Station because Charging Station does not', async () => {
    locationRepository.readChargingStationByStationId.mockResolvedValue(
      undefined,
    );

    await statusNotificationService.processStatusNotification(
      MOCK_STATION_ID,
      aStatusNotificationRequest(),
    );

    expect(
      locationRepository.addStatusNotificationToChargingStation,
    ).not.toHaveBeenCalled();
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
      MOCK_STATION_ID,
      aStatusNotificationRequest(),
    );

    expect(
      deviceModelRepository.createOrUpdateDeviceModelByStationId,
    ).toHaveBeenCalled();
  });

  describe('Component or Variable does not exist', () => {
    it('should not save Component and Variable ReportData because Component does not exist', async () => {
      componentRepository.readOnlyOneByQuery.mockResolvedValue(undefined);

      await statusNotificationService.processStatusNotification(
        MOCK_STATION_ID,
        aStatusNotificationRequest(),
      );

      expect(
        deviceModelRepository.createOrUpdateDeviceModelByStationId,
      ).not.toHaveBeenCalled();
    });

    it('should not save Component and Variable ReportData because Variable does not exist', async () => {
      componentRepository.readOnlyOneByQuery.mockResolvedValue(aComponent());

      await statusNotificationService.processStatusNotification(
        MOCK_STATION_ID,
        aStatusNotificationRequest(),
      );

      expect(
        deviceModelRepository.createOrUpdateDeviceModelByStationId,
      ).not.toHaveBeenCalled();
    });
  });
});
