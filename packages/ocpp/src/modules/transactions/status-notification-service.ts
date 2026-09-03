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
import type { IDeviceModelRepository, ILocationRepository } from '@citrineos/dal';
import { OCPP1_6_Mapper, OCPP2_0_1_Mapper } from '@citrineos/dal';
import { Component, EvseType, Variable } from '@citrineos/dal';
import { Connector, StatusNotification } from '@citrineos/dal';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class StatusNotificationService {
  protected _componentRepository: CrudRepository<Component>;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _locationRepository: ILocationRepository;
  protected _cache: ICache;
  protected _logger: Logger<ILogObj>;

  constructor({
    componentRepository,
    deviceModelRepository,
    locationRepository,
    cache,
    logger,
  }: {
    componentRepository: CrudRepository<Component>;
    deviceModelRepository: IDeviceModelRepository;
    locationRepository: ILocationRepository;
    cache: ICache;
    logger?: Logger<ILogObj>;
  }) {
    this._componentRepository = componentRepository;
    this._deviceModelRepository = deviceModelRepository;
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
    const chargingStation = await this._locationRepository.readChargingStationByStationId(
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

    let matchingEvse = chargingStation.evses?.find(
      (evse) => evse.evseTypeId === statusNotificationRequest.evseId,
    );
    // let matchingConnector: ConnectorDto | undefined = (
    //   matchingEvse?.connectors as Connector[] | undefined
    // )?.find((c) => c.evseTypeConnectorId === statusNotificationRequest.connectorId);

    const connectionJson = await this._cache.get<string>(
      createIdentifier(tenantId, ocppConnectionName),
      CacheNamespace.Connections,
    );
    const connection: IWebsocketConnection | null = connectionJson
      ? JSON.parse(connectionJson)
      : null;
    if (!connection?.allowUnknownChargingStations) {
      if (!matchingEvse) {
        this._logger.error(
          `Connector ${statusNotificationRequest.connectorId} on station ${ocppConnectionName} does not exist and allowUnknownChargingStations is false`,
        );
        return;
      }
    } else if (!matchingEvse) {
      matchingEvse = await this._locationRepository.createOrUpdateEvse(tenantId, {
        evseTypeId: statusNotificationRequest.evseId,
        ocppConnectionName,
      });

      if (matchingEvse.evseTypeId! > 1) {
        this._logger.warn(
          `Connector ${statusNotificationRequest.connectorId} on station ${ocppConnectionName} does not exist and allowUnknownChargingStations is true, but the EVSE has evseTypeId ${matchingEvse.evseTypeId}. This may cause a collision with an existing connectorId on a multi-evse station.`,
        );
      }
    }

    const connector = {
      tenantId,
      stationId: chargingStation.id,
      evseId: matchingEvse.id!,
      evseTypeConnectorId: statusNotificationRequest.connectorId,
      ocppConnectionName: ocppConnectionName,
      status: OCPP2_0_1_Mapper.LocationMapper.mapConnectorStatus(
        statusNotificationRequest.connectorStatus,
      ),
      timestamp: statusNotificationRequest.timestamp,
    };

    await this._locationRepository.createOrUpdateOcpp2Connector(tenantId, connector);

    await this._locationRepository.addStatusNotificationToChargingStation(
      tenantId,
      ocppConnectionName,
      statusNotification,
    );

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
    const chargingStation = await this._locationRepository.readChargingStationByStationId(
      tenantId,
      ocppConnectionName,
    );
    if (chargingStation) {
      const matchingEvse = chargingStation.evses?.find((evse) =>
        evse.connectors?.find(
          (connector) => connector.connectorId === statusNotificationRequest.connectorId,
        ),
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
      } as ConnectorDto & { connectorId: number };

      if (chargingStation.use16StatusNotification0 && statusNotificationRequest.connectorId === 0) {
        // update all connectors at this station — connectorId stripped so we
        // don't overwrite the per-row connectorId values
        await this._locationRepository.updateAllConnectorsByQuery(
          tenantId,
          {
            ...connector,
            connectorId: undefined,
          },
          {
            where: { stationId: chargingStation.id, tenantId },
          },
        );
      } else if (statusNotificationRequest.connectorId !== 0) {
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
          const commissioned = await this._locationRepository.autocommissionEvseForOcpp16Connector(
            tenantId,
            ocppConnectionName,
          );
          connector.evseId = commissioned.evseId;
        } else {
          connector.evseId = matchingEvse.id as number;
        }

        await this._locationRepository.createOrUpdateOcpp16Connector(tenantId, connector);
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
