// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  CrudRepository,
  DEFAULT_TENANT_ID,
  type ICache,
  type IWebsocketConnection,
} from '@citrineos/base';
import {
  Component,
  type IChargingStationRepository,
  type IConnectorRepository,
  type IDeviceModelRepository,
  type IEvseRepository,
  type IStatusNotificationRepository,
  StatusNotification,
} from '@citrineos/dal';
import { StatusNotificationService } from '@modules/transactions/status-notification-service.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
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
} from './providers/device-model-provider.js';
import {
  aOcpp16StatusNotificationRequest,
  aStatusNotification,
  aStatusNotificationRequest,
} from './providers/status-notification.js';

// Mock StatusNotification model
vi.mock('@dal/models/location/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dal/models/location/index.js')>();

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
  // One mock object backs both injected tokens: the service takes station reads from
  // chargingStationRepository and everything else from locationRepository, but the
  // assertions here do not care which token a call arrived through.
  let locationRepository: Mocked<
    IChargingStationRepository &
      IConnectorRepository &
      IEvseRepository &
      IStatusNotificationRepository
  >;
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
      readChargingStationByOcppConnectionName: vi.fn(),
      createOrUpdateOcpp16Connector: vi.fn(),
      createOrUpdateOcpp2Connector: vi.fn(),
      createOrUpdateEvse: vi.fn(),
      autoCommissionEvseForOcpp16Connector: vi.fn(),
      updateAllConnectorsByStationId: vi.fn(),
    } as unknown as Mocked<
      IChargingStationRepository &
        IConnectorRepository &
        IEvseRepository &
        IStatusNotificationRepository
    >;

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
      chargingStationRepository: locationRepository,
      evseRepository: locationRepository,
      connectorRepository: locationRepository,
      locationRepository,
      cache,
    });
  });

  it('should save StatusNotification for Charging Station because Charging Station exists', async () => {
    locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
      aChargingStation(),
    );
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
    locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(undefined);

    await statusNotificationService.processStatusNotification(
      DEFAULT_TENANT_ID,
      MOCK_STATION_ID,
      aStatusNotificationRequest(),
    );

    expect(locationRepository.addStatusNotificationToChargingStation).not.toHaveBeenCalled();
  });

  it('should save Component and Variable ReportData because Station and Component and Variable exist', async () => {
    locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
      aChargingStation(),
    );
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
    // EVSEs reports connectorId 1 twice - once for each EVSE. The incoming connectorId therefore
    // has to be resolved through the matching EVSE rather than used as a station-wide identifier.
    const aTwoEvseChargingStation = () =>
      aChargingStation((cs) => {
        cs.evses = [
          aEvse((evse) => {
            evse.id = 10;
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
            evse.id = 20;
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
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
        aTwoEvseChargingStation(),
      );
      componentRepository.readAllByQuery.mockResolvedValue([]);
      vi.spyOn(StatusNotification, 'build').mockImplementation(() => aStatusNotification());
    });

    it('should update the second EVSE when it reports its connector 1', async () => {
      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest((request) => {
          request.evseId = 2;
          request.connectorId = 1;
        }),
      );

      expect(locationRepository.createOrUpdateOcpp2Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ evseId: 20, evseTypeConnectorId: 1 }),
      );
    });

    it('should update the first EVSEwhen it reports its connector 1', async () => {
      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest((request) => {
          request.evseId = 1;
          request.connectorId = 1;
        }),
      );

      expect(locationRepository.createOrUpdateOcpp2Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ evseId: 10, evseTypeConnectorId: 1 }),
      );
    });

    it('should give each EVSE a distinct update when both report their connector 1', async () => {
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

      const targeted = locationRepository.createOrUpdateOcpp2Connector.mock.calls.map(
        ([, connector]) => connector.evseId,
      );

      expect(targeted).toEqual([10, 20]);
    });
  });

  describe('Test process OCPP 2.0.1 StatusNotification for an unknown connector', () => {
    beforeEach(() => {
      componentRepository.readAllByQuery.mockResolvedValue([]);
      vi.spyOn(StatusNotification, 'build').mockImplementation(() => aStatusNotification());
    });

    it('should commission an EVSE and synthesize the connector when neither exists and allowUnknownChargingStations is true', async () => {
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [];
        }),
      );
      locationRepository.createOrUpdateEvse.mockResolvedValue(
        aEvse((evse) => {
          evse.id = 99;
          evse.evseTypeId = 1;
          evse.connectors = [];
        }),
      );

      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest((request) => {
          request.evseId = 1;
          request.connectorId = 1;
        }),
      );

      expect(locationRepository.createOrUpdateEvse).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
        evseTypeId: 1,
        ocppConnectionName: MOCK_STATION_ID,
      });
      expect(locationRepository.createOrUpdateOcpp2Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({
          tenantId: DEFAULT_TENANT_ID,
          stationId: MOCK_STATION_ID,
          evseId: 99,
          evseTypeConnectorId: 1,
          ocppConnectionName: MOCK_STATION_ID,
        }),
      );
    });

    it('should not invent an OCPP 1.6 connectorId for a synthesized 2.0.1 connector', async () => {
      // The 2.0.1 connectorId is scoped to the EVSE, so reusing it as the station-wide
      // 1.6 connectorId collides with a real connector on a multi-EVSE station. The
      // synthesized record carries evseTypeConnectorId only and leaves connectorId unset.
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [
            aEvse((evse) => {
              evse.id = 1;
              evse.evseTypeId = 1;
              evse.connectors = [
                aConnector((c) => {
                  c.connectorId = 1;
                  c.evseTypeConnectorId = 1;
                }),
              ];
            }),
          ];
        }),
      );
      locationRepository.createOrUpdateEvse.mockResolvedValue(
        aEvse((evse) => {
          evse.id = 2;
          evse.evseTypeId = 2;
          evse.connectors = [];
        }),
      );

      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest((request) => {
          // EVSE 2's connector 1 — the same per-EVSE number EVSE 1 already uses.
          request.evseId = 2;
          request.connectorId = 1;
        }),
      );

      const [, synthesized] = locationRepository.createOrUpdateOcpp2Connector.mock.calls[0];
      expect(synthesized.connectorId).toBeUndefined();
      expect(synthesized).toMatchObject({ evseId: 2, evseTypeConnectorId: 1 });
    });

    it('should reuse the existing EVSE and only synthesize the connector when the EVSE is known', async () => {
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
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
      expect(locationRepository.createOrUpdateOcpp2Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({
          evseId: MOCK_EVSE_ID,
          evseTypeConnectorId: 2,
        }),
      );
    });

    it('should upsert the Connector before recording the StatusNotification', async () => {
      // StatusNotification rows point at a Connector, so the connector has to be
      // upserted first or the notification references a row that does not exist yet.
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [aEvse()];
        }),
      );

      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest((request) => {
          request.evseId = MOCK_EVSE_ID;
          request.connectorId = MOCK_CONNECTOR_ID;
        }),
      );

      const connectorUpsertOrder =
        locationRepository.createOrUpdateOcpp2Connector.mock.invocationCallOrder[0];
      const statusNotificationOrder =
        locationRepository.addStatusNotificationToChargingStation.mock.invocationCallOrder[0];
      expect(connectorUpsertOrder).toBeLessThan(statusNotificationOrder);
    });

    it('should record nothing at all when allowUnknownChargingStations is false', async () => {
      // The 2.0.1 path logs and returns rather than throwing. The StatusNotification is
      // written after the connector upsert, so an unknown connector under strict mode
      // leaves no rows behind at all rather than an audit record pointing nowhere.
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
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

      expect(locationRepository.addStatusNotificationToChargingStation).not.toHaveBeenCalled();
      expect(locationRepository.createOrUpdateEvse).not.toHaveBeenCalled();
      expect(locationRepository.createOrUpdateOcpp2Connector).not.toHaveBeenCalled();
      expect(deviceModelRepository.createOrUpdateDeviceModelByStationId).not.toHaveBeenCalled();
    });
  });

  describe('Test process OCPP 1.6 StatusNotification', () => {
    it('should save StatusNotification and connector when Charging Station exists with a matching evse', async () => {
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
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
      expect(locationRepository.createOrUpdateOcpp16Connector).toHaveBeenCalled();
    });

    it('should not save StatusNotification or connector when Charging Station does not exist', async () => {
      componentRepository.readAllByQuery.mockResolvedValue([aComponent()]);

      await statusNotificationService.processStatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aStatusNotificationRequest(),
      );

      expect(locationRepository.addStatusNotificationToChargingStation).not.toHaveBeenCalled();
      expect(locationRepository.createOrUpdateOcpp16Connector).not.toHaveBeenCalled();
      expect(locationRepository.createOrUpdateOcpp2Connector).not.toHaveBeenCalled();
    });
  });

  describe('Test process OCPP 1.6 StatusNotification sets FK fields on Connector record (#160)', () => {
    it('should stamp evseId on the Connector record when matching evse exists', async () => {
      // Regression for citrineos/citrineos#160 — Connector model declares evseId
      // as allowNull:false, so the upsert must include the FK or it crashes with
      // "notNull Violation: Connector.evseId cannot be null".
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
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

      expect(locationRepository.createOrUpdateOcpp16Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ evseId: MOCK_EVSE_ID }),
      );
    });

    it('should leave evseTypeConnectorId unset on the Connector record', async () => {
      // The 1.6 request only carries the station-wide connectorId. evseTypeConnectorId is
      // the per-EVSE 2.0.1 number; stamping the 1.6 value into it claims a 2.0.1 identity
      // the station never reported, so the 1.6 path leaves it alone.
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
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

      const [, connector] = locationRepository.createOrUpdateOcpp16Connector.mock.calls[0];
      expect(connector.evseTypeConnectorId).toBeUndefined();
      expect(connector.connectorId).toBe(MOCK_CONNECTOR_ID);
    });

    it('should auto-commission an evse and stamp its FKs onto the Connector when allowUnknownChargingStations is true and no matching evse exists', async () => {
      // Reporter's repro (clean DB + 1.6 charger): the station exists from BootNotification
      // but no EVSE/Connector records exist. With ad-hoc mode enabled, the handler should
      // commission a new evse on demand (1 connector → 1 evse for OCPP 1.6) instead of
      // crashing with an FK violation.
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [];
        }),
      );
      const newEvseId = 99;
      locationRepository.autoCommissionEvseForOcpp16Connector.mockResolvedValue({
        evseId: newEvseId,
      });
      vi.spyOn(StatusNotification, 'build').mockImplementation(() => aStatusNotification());

      await statusNotificationService.processOcpp16StatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aOcpp16StatusNotificationRequest((req) => {
          req.connectorId = 7;
        }),
      );

      // The 1.6 connectorId is deliberately not passed: auto-commissioning no longer
      // derives the EVSE (or its EvseType) from it.
      expect(locationRepository.autoCommissionEvseForOcpp16Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
      );
      expect(locationRepository.createOrUpdateOcpp16Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({
          evseId: newEvseId,
          connectorId: 7,
        }),
      );
      const [, connector] = locationRepository.createOrUpdateOcpp16Connector.mock.calls[0];
      expect(connector.evseTypeConnectorId).toBeUndefined();
    });

    it('should throw and not upsert connector when allowUnknownChargingStations is false and no connector exists', async () => {
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
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

      expect(locationRepository.createOrUpdateOcpp16Connector).not.toHaveBeenCalled();
    });
  });

  describe('Test process OCPP 1.6 StatusNotification sets evseId in StatusNotification record', () => {
    it('should set evseId when matching evse is found for the connector', async () => {
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
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
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
        aChargingStation((cs) => {
          cs.evses = [aEvse()];
        }),
      );
      locationRepository.autoCommissionEvseForOcpp16Connector.mockResolvedValue({
        evseId: 50,
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
      expect(locationRepository.autoCommissionEvseForOcpp16Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
      );
      expect(locationRepository.createOrUpdateOcpp16Connector).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ evseId: 50, connectorId: 404 }),
      );
    });
  });

  describe('Test process OCPP 1.6 StatusNotification broadcast to connector 0', () => {
    it('should strip connectorId when fanning a connector-0 status out to every connector', async () => {
      // connectorId is the row's own identity; carrying the reported 0 into the bulk
      // update would overwrite every connector's number with 0.
      locationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
        aChargingStation((cs) => {
          cs.use16StatusNotification0 = true;
          cs.evses = [aEvse()];
        }),
      );
      vi.spyOn(StatusNotification, 'build').mockImplementation(() => aStatusNotification());

      await statusNotificationService.processOcpp16StatusNotification(
        DEFAULT_TENANT_ID,
        MOCK_STATION_ID,
        aOcpp16StatusNotificationRequest((req) => {
          req.connectorId = 0;
        }),
      );

      expect(locationRepository.updateAllConnectorsByQuery).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ connectorId: undefined }),
        { where: { stationId: MOCK_STATION_ID, tenantId: DEFAULT_TENANT_ID } },
      );
      expect(locationRepository.createOrUpdateOcpp16Connector).not.toHaveBeenCalled();
    });
  });
});
