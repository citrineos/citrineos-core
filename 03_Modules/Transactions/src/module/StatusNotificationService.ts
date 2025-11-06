// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  Component,
  Evse,
  EvseType,
  IDeviceModelRepository,
  ILocationRepository,
  Variable,
  Connector,
  StatusNotification,
  OCPP1_6_Mapper,
  OCPP2_0_1_Mapper,
} from '@citrineos/data';
import { ILogObj, Logger } from 'tslog';
import { CrudRepository, OCPP2_0_1, OCPP1_6 } from '@citrineos/base';

export class StatusNotificationService {
  protected _componentRepository: CrudRepository<Component>;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _locationRepository: ILocationRepository;
  protected _logger: Logger<ILogObj>;

  constructor(
    componentRepository: CrudRepository<Component>,
    deviceModelRepository: IDeviceModelRepository,
    locationRepository: ILocationRepository,
    logger?: Logger<ILogObj>,
  ) {
    this._componentRepository = componentRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._locationRepository = locationRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Stores an internal record of the incoming status, then updates the device model for the updated connector.
   *
   * @param {string} stationId - The Charging Station sending the status notification request
   * @param {StatusNotificationRequest} statusNotificationRequest
   */
  async processStatusNotification(
    tenantId: number,
    stationId: string,
    statusNotificationRequest: OCPP2_0_1.StatusNotificationRequest,
  ) {
    this._logger.debug(
      `Processing OCPP 2.0.1 StatusNotification for station: ${stationId}, evseId: ${statusNotificationRequest.evseId}, connectorId: ${statusNotificationRequest.connectorId}, status: ${statusNotificationRequest.connectorStatus}`,
    );

    const chargingStation = await this._locationRepository.readChargingStationByStationId(
      tenantId,
      stationId,
    );
    if (chargingStation) {
      const statusNotification = StatusNotification.build({
        tenantId,
        stationId,
        ...statusNotificationRequest,
      });
      await this._locationRepository.addStatusNotificationToChargingStation(
        tenantId,
        stationId,
        statusNotification,
      );

      // Find or create the Evse record based on stationId and evseTypeId
      this._logger.debug(
        `Looking for Evse with stationId: ${stationId}, evseTypeId: ${statusNotificationRequest.evseId}`,
      );
      const evse = await this._locationRepository.createOrUpdateEvse(tenantId, {
        tenantId,
        stationId,
        evseTypeId: statusNotificationRequest.evseId,
        evseId: `${stationId}-EVSE-${statusNotificationRequest.evseId}`, // Generate a default evseId
      } as Evse);

      if (!evse) {
        this._logger.error(
          `Failed to find or create Evse for stationId: ${stationId}, evseTypeId: ${statusNotificationRequest.evseId}. Cannot create or update connector.`,
        );
        return;
      }

      this._logger.debug(
        `Evse created or updated: id=${evse.id}, evseId=${evse.evseId}, evseTypeId=${evse.evseTypeId}`,
      );

      // For OCPP 2.0.1, station-level unique(stationId, connectorId) may collide across EVSEs
      // when multiple EVSEs use connectorId=1. Keep the EVSE-scoped index in evseTypeConnectorId
      // and derive a station-unique connectorId for persistence to satisfy legacy uniqueness.
      const stationScopedConnectorId =
        statusNotificationRequest.evseId * 1000 + statusNotificationRequest.connectorId;

      const connector = {
        tenantId,
        connectorId: stationScopedConnectorId,
        stationId,
        evseId: evse.id, // Use the Evse primary key
        evseTypeConnectorId: statusNotificationRequest.connectorId,
        status: OCPP2_0_1_Mapper.LocationMapper.mapConnectorStatus(
          statusNotificationRequest.connectorStatus,
        ),
        timestamp: statusNotificationRequest.timestamp
          ? statusNotificationRequest.timestamp
          : new Date().toISOString(),
      } as Connector;

      this._logger.debug(
        `Creating/updating Connector: connectorId=${connector.connectorId}, evseId=${connector.evseId}, evseTypeConnectorId=${connector.evseTypeConnectorId}, status=${connector.status}`,
      );
      await this._locationRepository.createOrUpdateConnector(tenantId, connector);

      const component = await this._componentRepository.readOnlyOneByQuery(tenantId, {
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
      const variable = component?.variables?.[0];
      if (!component || !variable) {
        this._logger.warn(
          'Missing component or variable for status notification. Status notification cannot be assigned to device model.',
        );
      } else {
        const reportDataType: OCPP2_0_1.ReportDataType = {
          component: component,
          variable: variable,
          variableAttribute: [
            {
              value: statusNotificationRequest.connectorStatus,
            },
          ],
        };
        await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(
          tenantId,
          reportDataType,
          stationId,
          statusNotificationRequest.timestamp,
        );
      }
    } else {
      this._logger.warn(
        `Charging station ${stationId} not found. Status notification cannot be associated with a charging station.`,
      );
    }
  }

  async processOcpp16StatusNotification(
    tenantId: number,
    stationId: string,
    statusNotificationRequest: OCPP1_6.StatusNotificationRequest,
  ) {
    const chargingStation = await this._locationRepository.readChargingStationByStationId(
      tenantId,
      stationId,
    );
    if (chargingStation) {
      const statusNotification = StatusNotification.build({
        tenantId,
        ...statusNotificationRequest,
        stationId,
        connectorStatus: statusNotificationRequest.status,
      });
      await this._locationRepository.addStatusNotificationToChargingStation(
        tenantId,
        stationId,
        statusNotification,
      );

      const connector = {
        tenantId,
        connectorId: statusNotificationRequest.connectorId,
        stationId,
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

      await this._locationRepository.createOrUpdateConnector(tenantId, connector);
    } else {
      this._logger.warn(
        `Charging station ${stationId} not found. Status notification cannot be associated with a charging station.`,
      );
    }
  }
}
