// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  CacheNamespace,
  createIdentifier,
  CrudRepository,
  type ICache,
  type IWebsocketConnection,
} from '@citrineos/base';
import { OCPP1_6, OCPP2_0_1, type ConnectorDto } from '@citrineos/types';
import type {
  IChargingStationRepository,
  IConnectorRepository,
  IDeviceModelRepository,
  IEvseRepository,
  IStatusNotificationRepository,
} from '@citrineos/dal';
import { OCPP1_6_Mapper, OCPP2_0_1_Mapper } from '@citrineos/dal';
import { Component, EvseType, Variable } from '@citrineos/dal';
import { Connector, StatusNotification } from '@citrineos/dal';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class StatusNotificationService {
  protected _componentRepository: CrudRepository<Component>;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _chargingStationRepository: IChargingStationRepository;
  protected _evseRepository: IEvseRepository;
  protected _connectorRepository: IConnectorRepository;
  protected _locationRepository: IStatusNotificationRepository;
  protected _cache: ICache;
  protected _logger: Logger<ILogObj>;

  constructor({
    componentRepository,
    deviceModelRepository,
    chargingStationRepository,
    evseRepository,
    connectorRepository,
    locationRepository,
    cache,
    logger,
  }: {
    componentRepository: CrudRepository<Component>;
    deviceModelRepository: IDeviceModelRepository;
    chargingStationRepository: IChargingStationRepository;
    evseRepository: IEvseRepository;
    connectorRepository: IConnectorRepository;
    locationRepository: IStatusNotificationRepository;
    cache: ICache;
    logger?: Logger<ILogObj>;
  }) {
    this._componentRepository = componentRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._chargingStationRepository = chargingStationRepository;
    this._evseRepository = evseRepository;
    this._connectorRepository = connectorRepository;
    this._locationRepository = locationRepository;
    this._cache = cache;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Stores an internal record of the incoming status, then updates the device model for the updated connector.
   *
   * @param ocppConnectionName - The connection name of the charging station
   * @param {StatusNotificationRequest} statusNotificationRequest
   */
  async processStatusNotification(
    tenantId: number,
    ocppConnectionName: string,
    statusNotificationRequest: OCPP2_0_1.StatusNotificationRequest,
  ) {
    const chargingStation =
      await this._chargingStationRepository.readChargingStationByOcppConnectionName(
        tenantId,
        ocppConnectionName,
      );
    if (!chargingStation) {
      this._logger.error(
        `Charging station ${ocppConnectionName} not found. Status notification cannot be associated with a charging station.`,
      );
      return;
    }

    const statusNotification = StatusNotification.build({
      tenantId,
      ocppConnectionName: ocppConnectionName,
      ...statusNotificationRequest,
      connectorStatus: OCPP2_0_1_Mapper.LocationMapper.mapConnectorStatus(
        statusNotificationRequest.connectorStatus,
      ),
    });
    await this._locationRepository.addStatusNotificationToChargingStation(
      tenantId,
      ocppConnectionName,
      statusNotification,
    );

    let matchingEvse = chargingStation.evses?.find(
      (evse) => evse.evseTypeId === statusNotificationRequest.evseId,
    );
    let matchingConnector: ConnectorDto | undefined = (
      matchingEvse?.connectors as Connector[] | undefined
    )?.find((c) => c.evseTypeConnectorId === statusNotificationRequest.connectorId);

    const connectionJson = await this._cache.get<string>(
      createIdentifier(tenantId, ocppConnectionName),
      CacheNamespace.Connections,
    );
    const connection: IWebsocketConnection | null = connectionJson
      ? JSON.parse(connectionJson)
      : null;
    if (!connection?.allowUnknownChargingStations) {
      if (!matchingConnector) {
        this._logger.error(
          `Connector ${statusNotificationRequest.connectorId} on station ${ocppConnectionName} does not exist and allowUnknownChargingStations is false`,
        );
        return;
      }
    } else if (!matchingConnector) {
      if (!matchingEvse) {
        matchingEvse = await this._evseRepository.createOrUpdateEvse(tenantId, {
          evseTypeId: statusNotificationRequest.evseId,
          ocppConnectionName,
        });
      }
      matchingConnector = {
        tenantId,
        stationId: chargingStation.id,
        evseId: matchingEvse.id!,
        evseTypeConnectorId: statusNotificationRequest.connectorId,
        /**
         * Note: This is the OCPP 1.6 connectorId, which is NOT the same as the evseTypeConnectorId
         * for OCPP 2.0.1 -- it is possible this will collide with an existing connectorId on a
         * multi-evse station. Do not autocommission multi-evse stations.
         */
        connectorId: statusNotificationRequest.connectorId,
        ocppConnectionName: ocppConnectionName,
      };
      if (matchingEvse.evseTypeId! > 1) {
        this._logger.warn(
          `Connector ${statusNotificationRequest.connectorId} on station ${ocppConnectionName} does not exist and allowUnknownChargingStations is true, but the EVSE has evseTypeId ${matchingEvse.evseTypeId}. This may cause a collision with an existing connectorId on a multi-evse station.`,
        );
      }
    }

    await this._connectorRepository.createOrUpdateConnector(tenantId, matchingConnector);

    let components = await this._componentRepository.readAllByQuery(tenantId, {
      where: {
        tenantId,
        name: 'Connector',
      },
      include: [
        {
          model: EvseType,
          where: {
            id: statusNotificationRequest.evseId,
            connectorId: statusNotificationRequest.connectorId,
          },
        },
        {
          model: Variable,
          where: {
            name: 'AvailabilityState',
          },
        },
      ],
    });
    components = components.filter(
      (component) => component.variables?.length && component.variables.length > 0,
    );
    if (components.length === 0) {
      this._logger.warn(
        'Missing component or variable for status notification. Status notification cannot be assigned to device model.',
      );
    }
    for (const component of components) {
      const variable = component.variables?.[0];
      const reportDataType: OCPP2_0_1.ReportDataType = {
        component: component,
        variable: variable!,
        variableAttribute: [
          {
            value: statusNotificationRequest.connectorStatus,
          },
        ],
      };
      await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(
        tenantId,
        reportDataType,
        ocppConnectionName,
        statusNotificationRequest.timestamp,
      );
    }
  }

  async processOcpp16StatusNotification(
    tenantId: number,
    ocppConnectionName: string,
    statusNotificationRequest: OCPP1_6.StatusNotificationRequest,
  ) {
    const chargingStation =
      await this._chargingStationRepository.readChargingStationByOcppConnectionName(
        tenantId,
        ocppConnectionName,
      );
    if (chargingStation) {
      const matchingEvse = chargingStation.evses?.find((evse) =>
        evse.connectors?.find(
          (connector) => connector.connectorId === statusNotificationRequest.connectorId,
        ),
      );
      const matchingConnector = matchingEvse?.connectors?.find(
        (connector) => connector.connectorId === statusNotificationRequest.connectorId,
      );

      // We upsert the Connector BEFORE saving the StatusNotification because
      // StatusNotifications.connectorId has an FK to Connectors.connectorId.
      const connector = {
        tenantId,
        stationId: chargingStation.id,
        connectorId: statusNotificationRequest.connectorId,
        ocppConnectionName: ocppConnectionName,
        status: OCPP1_6_Mapper.LocationMapper.mapStatusNotificationRequestStatusToConnectorStatus(
          statusNotificationRequest.status,
        ),
        timestamp: statusNotificationRequest.timestamp
          ? statusNotificationRequest.timestamp
          : new Date().toISOString(),
        errorCode:
          OCPP1_6_Mapper.LocationMapper.mapStatusNotificationRequestErrorCodeToConnectorErrorCode(
            statusNotificationRequest.errorCode,
          ),
        info: statusNotificationRequest.info,
        vendorId: statusNotificationRequest.vendorId,
        vendorErrorCode: statusNotificationRequest.vendorErrorCode,
      } as Connector;

      if (chargingStation.use16StatusNotification0 && statusNotificationRequest.connectorId === 0) {
        // update all connectors at this station — connectorId stripped so we
        // don't overwrite the per-row connectorId values
        await this._connectorRepository.updateAllConnectorsByStationId(
          tenantId,
          chargingStation.id!,
          {
            ...connector,
            connectorId: undefined,
          },
        );
      } else if (statusNotificationRequest.connectorId !== 0) {
        // Connector model declares evseId and evseTypeConnectorId as allowNull:false.
        // For commissioned stations these come from the matching evse/connector;
        // for ad-hoc 1.6 stations we auto-commission below (citrineos/citrineos#160).
        if (!matchingEvse) {
          const connectionJson = await this._cache.get<string>(
            createIdentifier(tenantId, ocppConnectionName),
            CacheNamespace.Connections,
          );
          const connection: IWebsocketConnection | null = connectionJson
            ? JSON.parse(connectionJson)
            : null;
          if (!connection?.allowUnknownChargingStations) {
            throw new Error(
              `Connector ${statusNotificationRequest.connectorId} on station ${ocppConnectionName} does not exist and allowUnknownChargingStations is false`,
            );
          }
          const commissioned = await this._evseRepository.commissionEvseForOcpp16Connector(
            tenantId,
            ocppConnectionName,
            statusNotificationRequest.connectorId,
          );
          connector.evseId = commissioned.evseId;
          connector.evseTypeConnectorId = commissioned.evseTypeConnectorId;
        } else {
          // matchingConnector is found via the same predicate as matchingEvse,
          // so it is guaranteed to be defined when matchingEvse is.
          connector.evseId = matchingEvse.id as number;
          connector.evseTypeConnectorId = matchingConnector!.evseTypeConnectorId as number;
        }

        await this._connectorRepository.createOrUpdateConnector(tenantId, connector);
      }

      // Now that the Connector record exists (upserted above, or pre-existing in
      // the broadcast path), save the StatusNotification record.
      const statusNotificationInput: Partial<StatusNotification> = {
        tenantId,
        ...statusNotificationRequest,
        ocppConnectionName: ocppConnectionName,
        connectorStatus:
          OCPP1_6_Mapper.LocationMapper.mapStatusNotificationRequestStatusToConnectorStatus(
            statusNotificationRequest.status,
          ),
      };
      if (matchingEvse) {
        statusNotificationInput.evseId = matchingEvse.evseTypeId;
      }
      const statusNotification = StatusNotification.build(statusNotificationInput);
      await this._locationRepository.addStatusNotificationToChargingStation(
        tenantId,
        ocppConnectionName,
        statusNotification,
      );
    } else {
      this._logger.warn(
        `Charging station ${ocppConnectionName} not found. Status notification cannot be associated with a charging station.`,
      );
    }
  }
}
