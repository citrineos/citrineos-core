// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, type IWebsocketConnection } from '@citrineos/base';
import type {
  IChargingStationRepository,
  IConnectorRepository,
  IEvseRepository,
} from '@citrineos/dal';
import { ConnectorStatusEnum } from '@citrineos/types';
import { ConnectorStatusService } from '@modules/monitoring/connector-status-service.js';
import type { NetworkAlertService } from '@services/network-alerts/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  aChargingStation,
  aConnector,
  aEvse,
  MOCK_STATION_ID,
} from '../transactions/providers/device-model-provider.js';

describe('ConnectorStatusService', () => {
  const { container, logger } = createTestContainer();
  const STATION_DB_ID = 5;
  const EVSE_DB_ID = 30;
  const EVSE_TYPE_ID = 2;
  const CONNECTOR_ID = 1;
  const CONNECTOR_DB_ID = 70;
  const TIMESTAMP = '2026-03-04T05:06:07.000Z';
  const report = {
    evseId: EVSE_TYPE_ID,
    connectorId: CONNECTOR_ID,
    connectorStatus: ConnectorStatusEnum.Occupied,
    timestamp: TIMESTAMP,
  };

  let chargingStationRepository: {
    readChargingStationByOcppConnectionName: ReturnType<
      typeof vi.fn<IChargingStationRepository['readChargingStationByOcppConnectionName']>
    >;
  };
  let evseRepository: {
    createOrUpdateEvse: ReturnType<typeof vi.fn<IEvseRepository['createOrUpdateEvse']>>;
  };
  let connectorRepository: {
    readConnectorByStationIdAndOcpp201EvseType: ReturnType<
      typeof vi.fn<IConnectorRepository['readConnectorByStationIdAndOcpp201EvseType']>
    >;
    createOrUpdateOcpp2Connector: ReturnType<
      typeof vi.fn<IConnectorRepository['createOrUpdateOcpp2Connector']>
    >;
  };
  let networkAlertService: {
    recordConnectorStatus: ReturnType<typeof vi.fn<NetworkAlertService['recordConnectorStatus']>>;
  };
  let cache: { get: ReturnType<typeof vi.fn> };
  let service: ConnectorStatusService;

  function cacheConnection(allowUnknownChargingStations: boolean) {
    const connection: IWebsocketConnection = {
      id: 'test-server',
      timeConnected: new Date().toISOString(),
      protocol: 'ocpp2.1',
      allowUnknownChargingStations,
    };
    cache.get.mockResolvedValue(JSON.stringify(connection));
  }

  beforeEach(() => {
    logger.error.mockClear();
    logger.info.mockClear();
    chargingStationRepository = {
      readChargingStationByOcppConnectionName:
        vi.fn<IChargingStationRepository['readChargingStationByOcppConnectionName']>(),
    };
    evseRepository = {
      createOrUpdateEvse: vi.fn<IEvseRepository['createOrUpdateEvse']>(),
    };
    connectorRepository = {
      readConnectorByStationIdAndOcpp201EvseType:
        vi.fn<IConnectorRepository['readConnectorByStationIdAndOcpp201EvseType']>(),
      createOrUpdateOcpp2Connector: vi.fn<IConnectorRepository['createOrUpdateOcpp2Connector']>(),
    };
    networkAlertService = {
      recordConnectorStatus: vi.fn<NetworkAlertService['recordConnectorStatus']>(),
    };
    cache = { get: vi.fn() };

    chargingStationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(
      aChargingStation((station) => {
        station.id = STATION_DB_ID;
        station.evses = [
          aEvse((evse) => {
            evse.id = EVSE_DB_ID;
            evse.evseTypeId = EVSE_TYPE_ID;
          }),
        ];
      }),
    );
    connectorRepository.readConnectorByStationIdAndOcpp201EvseType.mockResolvedValue(undefined);
    connectorRepository.createOrUpdateOcpp2Connector.mockImplementation(
      async (_tenantId, connector) => ({ ...connector, id: CONNECTOR_DB_ID }),
    );
    cacheConnection(false);

    service = getTestInstance(container, ConnectorStatusService, {
      chargingStationRepository,
      evseRepository,
      connectorRepository,
      cache,
      networkAlertService,
    });
  });

  it('upserts the connector and records the alert without a status notification', async () => {
    await service.updateConnectorStatus(DEFAULT_TENANT_ID, MOCK_STATION_ID, report);

    expect(connectorRepository.createOrUpdateOcpp2Connector).toHaveBeenCalledExactlyOnceWith(
      DEFAULT_TENANT_ID,
      {
        tenantId: DEFAULT_TENANT_ID,
        stationId: STATION_DB_ID,
        evseId: EVSE_DB_ID,
        evseTypeConnectorId: CONNECTOR_ID,
        status: ConnectorStatusEnum.Occupied,
        timestamp: TIMESTAMP,
      },
    );
    expect(networkAlertService.recordConnectorStatus).toHaveBeenCalledExactlyOnceWith({
      tenantId: DEFAULT_TENANT_ID,
      stationId: STATION_DB_ID,
      evseId: EVSE_DB_ID,
      connectorId: CONNECTOR_DB_ID,
      status: ConnectorStatusEnum.Occupied,
      occurredAt: TIMESTAMP,
    });
  });

  it('looks up the existing connector by the reported EVSE and connector', async () => {
    await service.updateConnectorStatus(DEFAULT_TENANT_ID, MOCK_STATION_ID, report);

    expect(
      connectorRepository.readConnectorByStationIdAndOcpp201EvseType,
    ).toHaveBeenCalledExactlyOnceWith(DEFAULT_TENANT_ID, MOCK_STATION_ID, {
      id: EVSE_TYPE_ID,
      connectorId: CONNECTOR_ID,
    });
  });

  it('writes nothing when the station does not exist', async () => {
    chargingStationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(undefined);

    await service.updateConnectorStatus(DEFAULT_TENANT_ID, MOCK_STATION_ID, report);

    expect(connectorRepository.createOrUpdateOcpp2Connector).not.toHaveBeenCalled();
    expect(networkAlertService.recordConnectorStatus).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('writes nothing for an unknown EVSE when unknown charging stations are not allowed', async () => {
    await service.updateConnectorStatus(DEFAULT_TENANT_ID, MOCK_STATION_ID, {
      ...report,
      evseId: 9,
    });

    expect(evseRepository.createOrUpdateEvse).not.toHaveBeenCalled();
    expect(connectorRepository.createOrUpdateOcpp2Connector).not.toHaveBeenCalled();
    expect(networkAlertService.recordConnectorStatus).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('creates an unknown EVSE before the connector when unknown charging stations are allowed', async () => {
    const NEW_EVSE_DB_ID = 31;
    cacheConnection(true);
    evseRepository.createOrUpdateEvse.mockResolvedValue(
      aEvse((evse) => {
        evse.id = NEW_EVSE_DB_ID;
        evse.evseTypeId = 9;
      }),
    );

    await service.updateConnectorStatus(DEFAULT_TENANT_ID, MOCK_STATION_ID, {
      ...report,
      evseId: 9,
    });

    expect(evseRepository.createOrUpdateEvse).toHaveBeenCalledExactlyOnceWith(DEFAULT_TENANT_ID, {
      evseTypeId: 9,
      stationId: STATION_DB_ID,
    });
    expect(connectorRepository.createOrUpdateOcpp2Connector).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      expect.objectContaining({ evseId: NEW_EVSE_DB_ID, evseTypeConnectorId: CONNECTOR_ID }),
    );
  });

  it('ignores a status older than the one the connector already has', async () => {
    connectorRepository.readConnectorByStationIdAndOcpp201EvseType.mockResolvedValue(
      aConnector((connector) => {
        connector.timestamp = '2026-03-04T05:06:08.000Z';
      }),
    );

    await service.updateConnectorStatus(DEFAULT_TENANT_ID, MOCK_STATION_ID, report);

    expect(connectorRepository.createOrUpdateOcpp2Connector).not.toHaveBeenCalled();
    expect(networkAlertService.recordConnectorStatus).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });

  it('writes a status with the same timestamp as the connector already has', async () => {
    connectorRepository.readConnectorByStationIdAndOcpp201EvseType.mockResolvedValue(
      aConnector((connector) => {
        connector.timestamp = TIMESTAMP;
      }),
    );

    await service.updateConnectorStatus(DEFAULT_TENANT_ID, MOCK_STATION_ID, report);

    expect(connectorRepository.createOrUpdateOcpp2Connector).toHaveBeenCalledOnce();
  });

  it('writes a status newer than the one the connector already has', async () => {
    connectorRepository.readConnectorByStationIdAndOcpp201EvseType.mockResolvedValue(
      aConnector((connector) => {
        connector.timestamp = '2026-03-04T05:06:06.000Z';
      }),
    );

    await service.updateConnectorStatus(DEFAULT_TENANT_ID, MOCK_STATION_ID, report);

    expect(connectorRepository.createOrUpdateOcpp2Connector).toHaveBeenCalledOnce();
    expect(networkAlertService.recordConnectorStatus).toHaveBeenCalledOnce();
  });

  it('logs and does not throw when recording the alert fails', async () => {
    networkAlertService.recordConnectorStatus.mockRejectedValue(new Error('alert store down'));

    await expect(
      service.updateConnectorStatus(DEFAULT_TENANT_ID, MOCK_STATION_ID, report),
    ).resolves.toBeUndefined();

    expect(connectorRepository.createOrUpdateOcpp2Connector).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalled();
  });
});
