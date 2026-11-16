// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
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
  IConnectorRepository,
  IEvseRepository,
} from '@citrineos/dal';
import type { ConnectorDto, ConnectorStatusEnumType, EvseDto } from '@citrineos/types';
import type { ConnectorStatusInput, NetworkAlertService } from '@services/network-alerts/index.js';
import type { ILogObj, Logger } from 'tslog';

export interface ConnectorStatusReport {
  evseId: number;
  connectorId: number;
  connectorStatus: ConnectorStatusEnumType;
  timestamp: string;
}

export class ConnectorStatusService {
  protected _chargingStationRepository: IChargingStationRepository;
  protected _evseRepository: IEvseRepository;
  protected _connectorRepository: IConnectorRepository;
  protected _cache: ICache;
  protected _networkAlertService: Pick<NetworkAlertService, 'recordConnectorStatus'>;
  protected _logger: Logger<ILogObj>;

  constructor({
    chargingStationRepository,
    evseRepository,
    connectorRepository,
    cache,
    networkAlertService,
    logger,
  }: {
    chargingStationRepository: IChargingStationRepository;
    evseRepository: IEvseRepository;
    connectorRepository: IConnectorRepository;
    cache: ICache;
    networkAlertService: Pick<NetworkAlertService, 'recordConnectorStatus'>;
    logger?: Logger<ILogObj>;
  }) {
    this._chargingStationRepository = chargingStationRepository;
    this._evseRepository = evseRepository;
    this._connectorRepository = connectorRepository;
    this._cache = cache;
    this._networkAlertService = networkAlertService;
    this._logger = childLogger(logger, this.constructor.name);
  }

  async updateConnectorStatus(
    tenantId: number,
    ocppConnectionName: string,
    report: ConnectorStatusReport,
  ): Promise<void> {
    const evse = await this.findOrCreateEvse(
      tenantId,
      ocppConnectionName,
      report.evseId,
      report.connectorId,
    );
    if (!evse) {
      return;
    }

    const existingConnector =
      await this._connectorRepository.readConnectorByStationIdAndOcpp201EvseType(
        tenantId,
        ocppConnectionName,
        { id: report.evseId, connectorId: report.connectorId },
      );
    if (
      existingConnector?.timestamp &&
      Date.parse(report.timestamp) < Date.parse(existingConnector.timestamp)
    ) {
      this._logger.info(
        `Connector ${report.connectorId} on EVSE ${report.evseId} of station ${ocppConnectionName} already has a status from ${existingConnector.timestamp}. Older status ${report.connectorStatus} from ${report.timestamp} ignored.`,
      );
      return;
    }

    const connector: ConnectorDto & { evseTypeConnectorId: number } = {
      tenantId,
      stationId: evse.stationId,
      evseId: evse.id!,
      evseTypeConnectorId: report.connectorId,
      status: report.connectorStatus,
      timestamp: report.timestamp,
    };
    const savedConnector = await this._connectorRepository.createOrUpdateOcpp2Connector(
      tenantId,
      connector,
    );
    if (savedConnector?.id === undefined) {
      return;
    }

    await this.recordConnectorStatus({
      tenantId,
      stationId: evse.stationId,
      evseId: evse.id,
      connectorId: savedConnector.id,
      status: report.connectorStatus,
      occurredAt: report.timestamp,
    });
  }

  async findOrCreateEvse(
    tenantId: number,
    ocppConnectionName: string,
    evseId: number,
    connectorId: number,
  ): Promise<EvseDto | undefined> {
    const chargingStation =
      await this._chargingStationRepository.readChargingStationByOcppConnectionName(
        tenantId,
        ocppConnectionName,
      );
    if (!chargingStation) {
      this._logger.error(
        `Charging station ${ocppConnectionName} not found. Connector status cannot be associated with a charging station.`,
      );
      return undefined;
    }

    const matchingEvse = chargingStation.evses?.find((evse) => evse.evseTypeId === evseId);
    if (matchingEvse) {
      return matchingEvse;
    }

    const connectionJson = await this._cache.get<string>(
      createIdentifier(tenantId, ocppConnectionName),
      CacheNamespace.Connections,
    );
    const connection: IWebsocketConnection | null = connectionJson
      ? JSON.parse(connectionJson)
      : null;
    if (!connection?.allowUnknownChargingStations) {
      this._logger.error(
        `Connector ${connectorId} on station ${ocppConnectionName} does not exist and allowUnknownChargingStations is false`,
      );
      return undefined;
    }

    const evse = await this._evseRepository.createOrUpdateEvse(tenantId, {
      evseTypeId: evseId,
      stationId: chargingStation.id!,
    });
    if (evse.evseTypeId! > 1) {
      this._logger.warn(
        `Connector ${connectorId} on station ${ocppConnectionName} does not exist and allowUnknownChargingStations is true, but the EVSE has evseTypeId ${evse.evseTypeId}. This may cause a collision with an existing connectorId on a multi-evse station.`,
      );
    }
    return evse;
  }

  async recordConnectorStatus(connectorInput: ConnectorStatusInput): Promise<void> {
    try {
      await this._networkAlertService.recordConnectorStatus(connectorInput);
    } catch (error) {
      this._logger.error(
        `Failed to record connector status alert for connector ${connectorInput.connectorId}`,
        error,
      );
    }
  }
}
