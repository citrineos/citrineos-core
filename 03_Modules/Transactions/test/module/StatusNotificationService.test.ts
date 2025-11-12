// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { CrudRepository, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  Component,
  IDeviceModelRepository,
  ILocationRepository,
  StatusNotification,
} from '@citrineos/data';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { StatusNotificationService } from '../../src/module/StatusNotificationService.js';
import {
  aChargingStation,
  aComponent,
  anEvse,
  aVariable,
  MOCK_STATION_ID,
} from '../providers/DeviceModelProvider.js';
import {
  aOcpp16StatusNotificationRequest,
  aStatusNotification,
  aStatusNotificationRequest,
} from '../providers/StatusNotification.js';

describe('StatusNotificationService', () => {
  let statusNotificationService: StatusNotificationService;
  let componentRepository: Mocked<CrudRepository<Component>>;
  let deviceModelRepository: Mocked<IDeviceModelRepository>;
  let locationRepository: Mocked<ILocationRepository>;

  beforeEach(() => {
    componentRepository = {
      readAllByQuery: vi.fn(),
    } as unknown as Mocked<CrudRepository<Component>>;

    deviceModelRepository = {
      createOrUpdateDeviceModelByStationId: vi.fn(),
    } as unknown as Mocked<IDeviceModelRepository>;

    locationRepository = {
      addStatusNotificationToChargingStation: vi.fn(),
      readChargingStationByStationId: vi.fn(),
      createOrUpdateConnector: vi.fn(),
    } as unknown as Mocked<ILocationRepository>;

    statusNotificationService = new StatusNotificationService(
      componentRepository,
      deviceModelRepository,
      locationRepository,
    );
  });

  it('should save StatusNotification for Charging Station because Charging Station exists', async () => {
    locationRepository.readChargingStationByStationId.mockResolvedValue(aChargingStation());
    componentRepository.readAllByQuery.mockResolvedValue([]);
    vi.spyOn(StatusNotification, 'build').mockImplementation(() => {
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

  it('should save Component and Variable ReportData because Station and Component and Variable exist', async () => {
    locationRepository.readChargingStationByStationId.mockResolvedValue(aChargingStation());
    vi.spyOn(StatusNotification, 'build').mockImplementation(() => {
      return aStatusNotification();
    });
    componentRepository.readAllByQuery.mockResolvedValue([
      aComponent((c) => {
        c.name = 'Connector';
        c.evse = anEvse();
        c.variables = [
          aVariable((v) => {
            v.name = 'AvailabilityState';
          }),
        ];
      }),
    ]);

    await statusNotificationService.processStatusNotification(
      DEFAULT_TENANT_ID,
      MOCK_STATION_ID,
      aStatusNotificationRequest(),
    );

    expect(deviceModelRepository.createOrUpdateDeviceModelByStationId).toHaveBeenCalled();
  });

  it('should not save Component and Variable ReportData because Station doesnt exist', async () => {
    componentRepository.readAllByQuery.mockResolvedValue([
      aComponent((c) => {
        c.name = 'Connector';
        c.evse = anEvse();
        c.variables = [
          aVariable((v) => {
            v.name = 'AvailabilityState';
          }),
        ];
      }),
    ]);

    await statusNotificationService.processStatusNotification(
      DEFAULT_TENANT_ID,
      MOCK_STATION_ID,
      aStatusNotificationRequest(),
    );

    expect(deviceModelRepository.createOrUpdateDeviceModelByStationId).not.toHaveBeenCalled();
  });

  describe('Component or Variable does not exist', () => {
    it('should not save Component and Variable ReportData because Component does not exist', async () => {
      componentRepository.readAllByQuery.mockResolvedValue([]);

      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest(),
      );

      expect(deviceModelRepository.createOrUpdateDeviceModelByStationId).not.toHaveBeenCalled();
    });

    it('should not save Component and Variable ReportData because Variable does not exist', async () => {
      componentRepository.readAllByQuery.mockResolvedValue([aComponent()]);

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
      vi.spyOn(StatusNotification, 'build').mockImplementation(() => {
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
      componentRepository.readAllByQuery.mockResolvedValue([aComponent()]);

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
