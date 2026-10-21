// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  CacheNamespace,
  childLogger,
  createIdentifier,
  type ICache,
  type IWebsocketConnection,
} from '@citrineos/base';
import type {
  IChargingStationRepository,
  IComponentRepository,
  IEvseRepository,
  IStatusNotificationRepository,
  IVariableAttributeRepository,
} from '@citrineos/dal';
import { OCPP1_6_Mapper, OCPP2_0_1_Mapper } from '@citrineos/dal';
import {
  OCPP1_6,
  OCPP2_0_1,
  type ConnectorDto,
  type StatusNotificationDto,
} from '@citrineos/types';
import type { ConnectorStatusInput, NetworkAlertService } from '@services/network-alerts/index.js';
import type { ILogObj, Logger } from 'tslog';

export class StatusNotificationService {
  protected _componentRepository: IComponentRepository;
  protected _variableAttributeRepository: IVariableAttributeRepository;
  protected _chargingStationRepository: IChargingStationRepository;
  protected _evseRepository: IEvseRepository;
  protected _statusNotificationRepository: IStatusNotificationRepository;
  protected _cache: ICache;
  protected _networkAlertService: Pick<NetworkAlertService, 'recordConnectorStatus'>;
  protected _logger: Logger<ILogObj>;

  constructor({
    componentRepository,
    variableAttributeRepository,
    chargingStationRepository,
    evseRepository,
    statusNotificationRepository,
    cache,
    networkAlertService,
    logger,
  }: {
    componentRepository: IComponentRepository;
    variableAttributeRepository: IVariableAttributeRepository;
    chargingStationRepository: IChargingStationRepository;
    evseRepository: IEvseRepository;
    statusNotificationRepository: IStatusNotificationRepository;
    cache: ICache;
    networkAlertService: Pick<NetworkAlertService, 'recordConnectorStatus'>;
    logger?: Logger<ILogObj>;
  }) {
    this._componentRepository = componentRepository;
    this._variableAttributeRepository = variableAttributeRepository;
    this._chargingStationRepository = chargingStationRepository;
    this._evseRepository = evseRepository;
    this._statusNotificationRepository = statusNotificationRepository;
    this._cache = cache;
    this._networkAlertService = networkAlertService;
    this._logger = childLogger(logger, this.constructor.name);
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

    let matchingEvse = chargingStation.evses?.find(
      (evse) => evse.evseTypeId === statusNotificationRequest.evseId,
    );

    if (!matchingEvse) {
      const connectionJson = await this._cache.get<string>(
        createIdentifier(tenantId, ocppConnectionName),
        CacheNamespace.Connections,
      );
      const connection: IWebsocketConnection | null = connectionJson
        ? JSON.parse(connectionJson)
        : null;
      if (!connection?.allowUnknownChargingStations) {
        this._logger.error(
          `Connector ${statusNotificationRequest.connectorId} on station ${ocppConnectionName} does not exist and allowUnknownChargingStations is false`,
        );
        return;
      } else {
        matchingEvse = await this._evseRepository.createOrUpdateEvse(tenantId, {
          evseTypeId: statusNotificationRequest.evseId,
          stationId: chargingStation.id!,
        });

        if (matchingEvse.evseTypeId! > 1) {
          this._logger.warn(
            `Connector ${statusNotificationRequest.connectorId} on station ${ocppConnectionName} does not exist and allowUnknownChargingStations is true, but the EVSE has evseTypeId ${matchingEvse.evseTypeId}. This may cause a collision with an existing connectorId on a multi-evse station.`,
          );
        }
      }
    }

    const connector: ConnectorDto & { evseTypeConnectorId: number } = {
      tenantId,
      stationId: chargingStation.id!,
      evseId: matchingEvse.id!,
      evseTypeConnectorId: statusNotificationRequest.connectorId,
      status: OCPP2_0_1_Mapper.LocationMapper.mapConnectorStatus(
        statusNotificationRequest.connectorStatus,
      ),
      timestamp: statusNotificationRequest.timestamp,
    };

    const statusNotification: StatusNotificationDto = {
      tenantId,
      stationId: chargingStation.id!,
      ...statusNotificationRequest,
      connectorStatus: OCPP2_0_1_Mapper.LocationMapper.mapConnectorStatus(
        statusNotificationRequest.connectorStatus,
      ),
    };
    const { statusNotification: savedStatusNotification, connector: savedConnector } =
      await this._statusNotificationRepository.addOcpp2ConnectorStatusNotification(
        tenantId,
        ocppConnectionName,
        connector,
        statusNotification,
      );

    if (savedConnector.id !== undefined) {
      await this._recordConnectorStatus({
        tenantId,
        stationId: chargingStation.id!,
        evseId: matchingEvse.id,
        connectorId: savedConnector.id,
        status: statusNotification.connectorStatus,
        occurredAt: statusNotificationRequest.timestamp,
        statusNotificationId: savedStatusNotification.id,
      });
    }

    const components = await this._componentRepository.findConnectorComponentsForAvailabilityState(
      tenantId,
      statusNotificationRequest.evseId,
      statusNotificationRequest.connectorId,
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
      await this._variableAttributeRepository.createOrUpdateDeviceModelByStationId(
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
      const timestamp = statusNotificationRequest.timestamp
        ? statusNotificationRequest.timestamp
        : new Date().toISOString();
      const matchingEvse = chargingStation.evses?.find((evse) =>
        evse.connectors?.find(
          (connector) => connector.connectorId === statusNotificationRequest.connectorId,
        ),
      );

      const connector: ConnectorDto & { connectorId: number } = {
        tenantId,
        stationId: chargingStation.id!,
        connectorId: statusNotificationRequest.connectorId,
        status: OCPP1_6_Mapper.LocationMapper.mapStatusNotificationRequestStatusToConnectorStatus(
          statusNotificationRequest.status,
        ),
        timestamp,
        errorCode:
          OCPP1_6_Mapper.LocationMapper.mapStatusNotificationRequestErrorCodeToConnectorErrorCode(
            statusNotificationRequest.errorCode,
          ),
        info: statusNotificationRequest.info,
        vendorId: statusNotificationRequest.vendorId,
        vendorErrorCode: statusNotificationRequest.vendorErrorCode,
      } as ConnectorDto & { connectorId: number };

      if (!matchingEvse && statusNotificationRequest.connectorId !== 0) {
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
        const commissioned = await this._evseRepository.autoCommissionEvseForOcpp16Connector(
          tenantId,
          ocppConnectionName,
        );
        connector.evseId = commissioned.evseId;
      } else if (matchingEvse) {
        connector.evseId = matchingEvse.id!;
      }

      const statusNotification: StatusNotificationDto = {
        tenantId,
        ...statusNotificationRequest,
        stationId: chargingStation.id!,
        evseId: matchingEvse ? matchingEvse.evseTypeId : undefined,
        connectorStatus:
          OCPP1_6_Mapper.LocationMapper.mapStatusNotificationRequestStatusToConnectorStatus(
            statusNotificationRequest.status,
          ),
      };

      if (statusNotificationRequest.connectorId !== 0) {
        const { statusNotification: savedStatusNotification, connector: savedConnector } =
          await this._statusNotificationRepository.addOcpp16ConnectorStatusNotification(
            tenantId,
            ocppConnectionName,
            connector,
            statusNotification,
          );

        if (savedConnector.id !== undefined) {
          await this._recordConnectorStatus({
            tenantId,
            stationId: chargingStation.id!,
            evseId: savedConnector.evseId,
            connectorId: savedConnector.id,
            status: savedStatusNotification.connectorStatus,
            errorCode: savedConnector.errorCode,
            vendorErrorCode: statusNotificationRequest.vendorErrorCode,
            occurredAt: timestamp,
            statusNotificationId: savedStatusNotification.id,
          });
        }
      } else if (chargingStation.use16StatusNotification0) {
        // connectorId stripped so the broadcast doesn't overwrite each row's own connectorId
        await this._statusNotificationRepository.addOcpp16StationStatusNotification(
          tenantId,
          ocppConnectionName,
          { ...connector, connectorId: undefined },
          statusNotification,
        );
      } else {
        await this._statusNotificationRepository.addStatusNotificationToChargingStation(
          tenantId,
          ocppConnectionName,
          statusNotification,
        );
      }
    } else {
      this._logger.warn(
        `Charging station ${ocppConnectionName} not found. Status notification cannot be associated with a charging station.`,
      );
    }
  }

  private async _recordConnectorStatus(input: ConnectorStatusInput): Promise<void> {
    try {
      await this._networkAlertService.recordConnectorStatus(input);
    } catch (error) {
      this._logger.error(
        `Failed to record connector status alert for connector ${input.connectorId}`,
        error,
      );
    }
  }
}
