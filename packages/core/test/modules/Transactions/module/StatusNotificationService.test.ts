// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  CrudRepository,
  DEFAULT_TENANT_ID,
  type ICache,
  type IWebsocketConnection,
} from '@citrineos/base';
import { Component, IDeviceModelRepository, ILocationRepository } from '@citrineos/core';
import { StatusNotification } from '@dal/layers/sequelize/index.js';
import { StatusNotificationService } from '@modules/Transactions/src/module/StatusNotificationService.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import {
  aChargingStation,
  aComponent,
  aConnector,
  aEvse,
  anEvse,
  aVariable,
  MOCK_CONNECTOR_ID,
  MOCK_EVSE_ID,
  MOCK_STATION_ID,
} from '../providers/DeviceModelProvider.js';
import {
  aOcpp16StatusNotificationRequest,
  aStatusNotification,
  aStatusNotificationRequest,
} from '../providers/StatusNotification.js';

// Mock StatusNotification model
vi.mock('@dal/layers/sequelize/model/Location/index.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@dal/layers/sequelize/model/Location/index.js')>();

  class MockStatusNotification {
    id?: number;
    tenantId?: number;
    ocppConnectionName?: string;
    timestamp?: string;
    status?: string;
    connectorId?: number;
    errorCode?: string;
    info?: string;
    vendorId?: string;
    vendorErrorCode?: string;
    save = vi.fn().mockResolvedValue(this);

    static build = vi.fn().mockImplementation((data) => {
      const instance = new MockStatusNotification();
      Object.assign(instance, data);
      return instance;
    });
  }

  return {
    ...actual,
    StatusNotification: MockStatusNotification,
  };
});

describe('StatusNotificationService', () => {
  const { container } = createTestContainer();
  let statusNotificationService: StatusNotificationService;
  let componentRepository: Mocked<CrudRepository<Component>>;
  let deviceModelRepository: Mocked<IDeviceModelRepository>;
  let locationRepository: Mocked<ILocationRepository>;
  let cache: Mocked<ICache>;

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
      createOrUpdateEvse: vi.fn(),
      commissionEvseForOcpp16Connector: vi.fn(),
      commissionEvseForOcpp201Connector: vi
        .fn()
        .mockImplementation(
          async (
            _tenantId: number,
            _ocppConnectionName: string,
            _evseId: number,
            connectorId: number,
          ) => ({ evseId: 1, connectorId, evseTypeConnectorId: connectorId }),
        ),
      updateAllConnectorsByQuery: vi.fn(),
    } as unknown as Mocked<ILocationRepository>;

    const mockConnection: IWebsocketConnection = {
      id: 'test-server',
      timeConnected: new Date().toISOString(),
      protocol: 'ocpp2.0.1',
      allowUnknownChargingStations: true,
    };
    cache = {
      get: vi.fn().mockResolvedValue(JSON.stringify(mockConnection)),
    } as unknown as Mocked<ICache>;

    locationRepository.createOrUpdateEvse.mockResolvedValue(aEvse());

    statusNotificationService = getTestInstance(container, StatusNotificationService, {
      componentRepository,
      deviceModelRepository,
      locationRepository,
      cache,
    });
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

  describe('Test process OCPP 2.0.1 StatusNotification on a multi-EVSE Charging Station', () => {
    // In OCPP 2.0.1 the connectorId is scoped to the EVSE, so a station with two single-connector
    // EVSEs reports connectorId 1 twice - once for each EVSE. Connector.connectorId is the
    // station-wide OCPP 1.6 numbering and is what createOrUpdateConnector upserts on, so the
    // incoming connectorId has to be resolved through the matching EVSE rather than used directly.
    const aTwoEvseChargingStation = () =>
      aChargingStation((cs) => {
        cs.evses = [
          aEvse((evse) => {
            evse.id = 1;
            evse.evseTypeId = 1;
            evse.connectors = [
              aConnector((c) => {
                c.id = 10;
                c.evseId = 1;
                c.connectorId = 1;
                c.evseTypeConnectorId = 1;
              }),
            ];
          }),
          aEvse((evse) => {
            evse.id = 2;
            evse.evseTypeId = 2;
            evse.connectors = [
              aConnector((c) => {
                c.id = 20;
                c.evseId = 2;
                c.connectorId = 2;
                c.evseTypeConnectorId = 1;
              }),
            ];
          }),
        ];
      });

    beforeEach(() => {
      locationRepository.readChargingStationByStationId.mockResolvedValue(
        aTwoEvseChargingStation(),
      );
      componentRepository.readAllByQuery.mockResolvedValue([]);
      vi.spyOn(StatusNotification, 'build').mockImplementation(() => aStatusNotification());
    });

    it('should update the second EVSEs own connector when it reports its connector 1', async () => {
      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest((request) => {
          request.evseId = 2;
          request.connectorId = 1;
        }),
      );

      expect(locationRepository.createOrUpdateConnector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ evseId: 2, connectorId: 2, evseTypeConnectorId: 1 }),
      );
    });

    it('should update the first EVSEs own connector when it reports its connector 1', async () => {
      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest((request) => {
          request.evseId = 1;
          request.connectorId = 1;
        }),
      );

      expect(locationRepository.createOrUpdateConnector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ evseId: 1, connectorId: 1, evseTypeConnectorId: 1 }),
      );
    });

    it('should give each EVSE a distinct connector when both report their connector 1', async () => {
      for (const evseId of [1, 2]) {
        await statusNotificationService.processStatusNotification(
          DEFAULT_TENANT_ID,
          MOCK_STATION_ID,
          aStatusNotificationRequest((request) => {
            request.evseId = evseId;
            request.connectorId = 1;
          }),
        );
      }

      const targeted = locationRepository.createOrUpdateConnector.mock.calls.map(
        ([, connector]) => connector.connectorId,
      );

      expect(targeted).toEqual([1, 2]);
    });
  });

  describe('Test process OCPP 2.0.1 StatusNotification for an unknown connector', () => {
    beforeEach(() => {
      componentRepository.readAllByQuery.mockResolvedValue([]);
      vi.spyOn(StatusNotification, 'build').mockImplementation(() => aStatusNotification());
    });

    it('should commission an EVSE and synthesize the connector when neither exists and allowUnknownChargingStations is true', async () => {
      locationRepository.readChargingStationByStationId.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [];
        }),
      );
      locationRepository.commissionEvseForOcpp201Connector.mockResolvedValue({
        evseId: 99,
        connectorId: 1,
        evseTypeConnectorId: 1,
      });

      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest((request) => {
          request.evseId = 1;
          request.connectorId = 1;
        }),
      );

      expect(locationRepository.commissionEvseForOcpp201Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        1,
        1,
      );
      expect(locationRepository.createOrUpdateConnector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({
          tenantId: DEFAULT_TENANT_ID,
          stationId: MOCK_STATION_ID,
          evseId: 99,
          evseTypeConnectorId: 1,
          connectorId: 1,
          ocppConnectionName: MOCK_STATION_ID,
        }),
      );
    });

    it('should reuse the existing EVSE and only synthesize the connector when the EVSE is known', async () => {
      locationRepository.readChargingStationByStationId.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [aEvse()];
        }),
      );

      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest((request) => {
          request.evseId = MOCK_EVSE_ID;
          // aEvse()'s only connector has evseTypeConnectorId 1, so 2 is unknown.
          request.connectorId = 2;
        }),
      );

      expect(locationRepository.createOrUpdateEvse).not.toHaveBeenCalled();
      expect(locationRepository.createOrUpdateConnector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({
          evseId: MOCK_EVSE_ID,
          evseTypeConnectorId: 2,
          connectorId: 2,
        }),
      );
    });

    it('should record the StatusNotification but skip the connector upsert when allowUnknownChargingStations is false', async () => {
      // The 2.0.1 path logs and returns rather than throwing: the StatusNotification
      // is already persisted as an audit record before the check, but nothing is
      // commissioned and the device model is left untouched.
      locationRepository.readChargingStationByStationId.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [];
        }),
      );
      const strictConnection: IWebsocketConnection = {
        id: 'test-server',
        timeConnected: new Date().toISOString(),
        protocol: 'ocpp2.0.1',
        allowUnknownChargingStations: false,
      };
      cache.get = vi.fn().mockResolvedValue(JSON.stringify(strictConnection));

      await expect(
        statusNotificationService.processStatusNotification(
          DEFAULT_TENANT_ID,
          MOCK_STATION_ID,
          aStatusNotificationRequest((request) => {
            request.connectorId = 9;
          }),
        ),
      ).resolves.toBeUndefined();

      expect(locationRepository.addStatusNotificationToChargingStation).toHaveBeenCalled();
      expect(locationRepository.createOrUpdateEvse).not.toHaveBeenCalled();
      expect(locationRepository.createOrUpdateConnector).not.toHaveBeenCalled();
      expect(deviceModelRepository.createOrUpdateDeviceModelByStationId).not.toHaveBeenCalled();
    });
  });

  describe('Test process OCPP 1.6 StatusNotification', () => {
    it('should save StatusNotification and connector when Charging Station exists with a matching evse', async () => {
      locationRepository.readChargingStationByStationId.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [aEvse()];
        }),
      );
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

  describe('Test process OCPP 1.6 StatusNotification sets FK fields on Connector record (#160)', () => {
    it('should stamp evseId on the Connector record when matching evse exists', async () => {
      // Regression for citrineos/citrineos#160 — Connector model declares evseId
      // as allowNull:false, so the upsert must include the FK or it crashes with
      // "notNull Violation: Connector.evseId cannot be null".
      locationRepository.readChargingStationByStationId.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [aEvse()];
        }),
      );
      vi.spyOn(StatusNotification, 'build').mockImplementation(() => aStatusNotification());

      await statusNotificationService.processOcpp16StatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aOcpp16StatusNotificationRequest((req) => {
          req.connectorId = MOCK_CONNECTOR_ID;
        }),
      );

      expect(locationRepository.createOrUpdateConnector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ evseId: MOCK_EVSE_ID }),
      );
    });

    it('should stamp evseTypeConnectorId on the Connector record when matching evse exists', async () => {
      // Connector model also requires evseTypeConnectorId (FK to EvseType, allowNull:false).
      locationRepository.readChargingStationByStationId.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [aEvse()];
        }),
      );
      vi.spyOn(StatusNotification, 'build').mockImplementation(() => aStatusNotification());

      await statusNotificationService.processOcpp16StatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aOcpp16StatusNotificationRequest((req) => {
          req.connectorId = MOCK_CONNECTOR_ID;
        }),
      );

      expect(locationRepository.createOrUpdateConnector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ evseTypeConnectorId: MOCK_CONNECTOR_ID }),
      );
    });

    it('should auto-commission an evse and stamp its FKs onto the Connector when allowUnknownChargingStations is true and no matching evse exists', async () => {
      // Reporter's repro (clean DB + 1.6 charger): the station exists from BootNotification
      // but no EVSE/Connector records exist. With ad-hoc mode enabled, the handler should
      // commission a new evse on demand (1 connector → 1 evse for OCPP 1.6) instead of
      // crashing with an FK violation.
      locationRepository.readChargingStationByStationId.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [];
        }),
      );
      const newEvseId = 99;
      const newEvseTypeConnectorId = 1;
      locationRepository.commissionEvseForOcpp16Connector.mockResolvedValue({
        evseId: newEvseId,
        evseTypeConnectorId: newEvseTypeConnectorId,
      });
      vi.spyOn(StatusNotification, 'build').mockImplementation(() => aStatusNotification());

      await statusNotificationService.processOcpp16StatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aOcpp16StatusNotificationRequest((req) => {
          req.connectorId = 7;
        }),
      );

      expect(locationRepository.commissionEvseForOcpp16Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        7,
      );
      expect(locationRepository.createOrUpdateConnector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({
          evseId: newEvseId,
          evseTypeConnectorId: newEvseTypeConnectorId,
          connectorId: 7,
        }),
      );
    });

    it('should throw and not upsert connector when allowUnknownChargingStations is false and no connector exists', async () => {
      locationRepository.readChargingStationByStationId.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [];
        }),
      );
      const strictConnection: IWebsocketConnection = {
        id: 'test-server',
        timeConnected: new Date().toISOString(),
        protocol: 'ocpp1.6',
        allowUnknownChargingStations: false,
      };
      cache.get = vi.fn().mockResolvedValue(JSON.stringify(strictConnection));
      vi.spyOn(StatusNotification, 'build').mockImplementation(() => aStatusNotification());

      await expect(
        statusNotificationService.processOcpp16StatusNotification(
          DEFAULT_TENANT_ID,
          MOCK_STATION_ID,
          aOcpp16StatusNotificationRequest((req) => {
            req.connectorId = 9;
          }),
        ),
      ).rejects.toThrow(/does not exist and allowUnknownChargingStations is false/);

      expect(locationRepository.createOrUpdateConnector).not.toHaveBeenCalled();
    });
  });

  describe('Test process OCPP 1.6 StatusNotification sets evseId in StatusNotification record', () => {
    it('should set evseId when matching evse is found for the connector', async () => {
      locationRepository.readChargingStationByStationId.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [aEvse()];
        }),
      );

      const mockStatusNotification = aStatusNotification();
      const buildSpy = vi.spyOn(StatusNotification, 'build').mockImplementation((input: any) => {
        expect(input.evseId).toBe(MOCK_EVSE_ID);
        return mockStatusNotification;
      });

      await statusNotificationService.processOcpp16StatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aOcpp16StatusNotificationRequest((req) => {
          req.connectorId = MOCK_CONNECTOR_ID;
        }),
      );

      expect(buildSpy).toHaveBeenCalled();
      expect(locationRepository.addStatusNotificationToChargingStation).toHaveBeenCalled();
    });

    it('should not set evseId on StatusNotification record when no matching evse is found, then auto-commission for the Connector record', async () => {
      // The StatusNotification record itself is saved without evseId (audit trail),
      // and the Connector record gets FKs from a freshly-commissioned evse.
      locationRepository.readChargingStationByStationId.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [aEvse()];
        }),
      );
      locationRepository.commissionEvseForOcpp16Connector.mockResolvedValue({
        evseId: 50,
        evseTypeConnectorId: 1,
      });

      const buildSpy = vi.spyOn(StatusNotification, 'build').mockImplementation((input: any) => {
        expect(input.evseId).toBeUndefined();
        return aStatusNotification();
      });

      await statusNotificationService.processOcpp16StatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aOcpp16StatusNotificationRequest((req) => {
          req.connectorId = 404;
        }),
      );

      expect(buildSpy).toHaveBeenCalled();
      expect(locationRepository.addStatusNotificationToChargingStation).toHaveBeenCalled();
      expect(locationRepository.commissionEvseForOcpp16Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        404,
      );
      expect(locationRepository.createOrUpdateConnector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ evseId: 50, evseTypeConnectorId: 1, connectorId: 404 }),
      );
    });
  });
});
