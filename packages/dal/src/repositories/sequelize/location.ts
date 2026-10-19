// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { CrudRepository } from '@citrineos/base';
import {
  type ChargingStationDto,
  type ConnectorDto,
  type EvseDto,
  type StatusNotificationDto,
  type OCPP2_0_1,
  OCPPVersion,
} from '@citrineos/types';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import {
  type ConnectorStatusNotificationResult,
  type IChargingStationRepository,
  type IConnectorRepository,
  type IEvseRepository,
  type ILocationRepository,
  type IStatusNotificationRepository,
  type StationStatusNotificationResult,
} from '../repositories.js';
import { ChargingStation } from '../../models/location/charging-station.js';
import { Connector } from '../../models/location/connector.js';
import { Evse } from '../../models/location/evse.js';
import { Location } from '../../models/location/location.js';
import { StatusNotification } from '../../models/location/status-notification.js';
import { Tariff } from '../../models/tariff/tariffs.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import {
  resolveStationId,
  resolveStationIdOrThrow,
  stationIdFilter,
} from './resolve-station-id.js';

export class SequelizeLocationRepository
  extends SequelizeRepository<Location>
  implements
    ILocationRepository,
    IChargingStationRepository,
    IStatusNotificationRepository,
    IConnectorRepository,
    IEvseRepository
{
  chargingStation: CrudRepository<ChargingStation>;
  statusNotification: CrudRepository<StatusNotification>;
  evse: CrudRepository<Evse>;
  connector: CrudRepository<Connector>;

  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: Location.MODEL_NAME, logger, sequelizeInstance });
    this.chargingStation = new SequelizeRepository<ChargingStation>({
      config,
      namespace: ChargingStation.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.statusNotification = new SequelizeRepository<StatusNotification>({
      config,
      namespace: StatusNotification.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.evse = new SequelizeRepository<Evse>({
      config,
      namespace: Evse.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.connector = new SequelizeRepository<Connector>({
      config,
      namespace: Connector.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
  }

  async readLocationById(tenantId: number, id: number): Promise<Location | undefined> {
    return await this.readOnlyOneByQuery(tenantId, {
      where: { id },
      include: [ChargingStation],
    });
  }

  async readChargingStationByOcppConnectionName(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<ChargingStation | undefined> {
    return (
      (await ChargingStation.findOne({
        where: {
          ocppConnectionName: ocppConnectionName,
          tenantId,
        },
        include: [{ model: Evse, include: [Connector] }],
      })) ?? undefined
    );
  }

  async setChargingStationIsOnlineAndOCPPVersion(
    tenantId: number,
    ocppConnectionName: string,
    isOnline: boolean,
    ocppVersion: OCPPVersion | null,
    connectedWebsocketServerConfigId?: string | null,
  ): Promise<ChargingStation | undefined> {
    const station = await ChargingStation.findOne({
      where: { ocppConnectionName: ocppConnectionName, tenantId },
    });

    if (!station) {
      if (!isOnline) {
        this.logger.debug(
          `setChargingStationIsOnlineAndOCPPVersion: No charging station found for tenant ${tenantId} with ocppConnectionName ${ocppConnectionName} while going offline; skipping.`,
        );
        return undefined;
      }
      return await ChargingStation.create({
        ocppConnectionName,
        tenantId,
        isOnline,
        protocol: ocppVersion,
        connectedWebsocketServerConfigId: connectedWebsocketServerConfigId ?? null,
        lastConnectedAt: new Date().toISOString(),
      });
    }

    await station.update({
      isOnline,
      protocol: ocppVersion,
      connectedWebsocketServerConfigId: connectedWebsocketServerConfigId ?? null,
      ...(isOnline && { lastConnectedAt: new Date().toISOString() }),
    });
    return station;
  }

  async doesChargingStationExistByOcppConnectionName(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<boolean> {
    return (
      (await this.chargingStation.existByQuery(tenantId, {
        where: { ocppConnectionName: ocppConnectionName, tenantId },
      })) > 0
    );
  }

  async addStatusNotificationToChargingStation(
    tenantId: number,
    ocppConnectionName: string,
    statusNotification: StatusNotificationDto,
  ): Promise<StatusNotification> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    return await this.s.transaction((transaction) =>
      this.insertStatusNotification(tenantId, stationId, statusNotification, transaction),
    );
  }

  async addOcpp2ConnectorStatusNotification(
    tenantId: number,
    ocppConnectionName: string,
    connector: ConnectorDto & { evseTypeConnectorId: number },
    statusNotification: StatusNotificationDto,
  ): Promise<ConnectorStatusNotificationResult> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    return await this.s.transaction(async (transaction) =>
      this.linkStatusNotificationToConnector(
        tenantId,
        ocppConnectionName,
        stationId,
        await this.upsertConnector(
          tenantId,
          connector,
          {
            tenantId,
            evseId: connector.evseId,
            evseTypeConnectorId: connector.evseTypeConnectorId,
          },
          transaction,
        ),
        statusNotification,
        transaction,
      ),
    );
  }

  async addOcpp16ConnectorStatusNotification(
    tenantId: number,
    ocppConnectionName: string,
    connector: ConnectorDto & { connectorId: number },
    statusNotification: StatusNotificationDto,
  ): Promise<ConnectorStatusNotificationResult> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    return await this.s.transaction(async (transaction) =>
      this.linkStatusNotificationToConnector(
        tenantId,
        ocppConnectionName,
        stationId,
        await this.upsertConnector(
          tenantId,
          connector,
          {
            tenantId,
            stationId: connector.stationId,
            connectorId: connector.connectorId,
          },
          transaction,
        ),
        statusNotification,
        transaction,
      ),
    );
  }

  async addOcpp16StationStatusNotification(
    tenantId: number,
    ocppConnectionName: string,
    connector: Partial<ConnectorDto>,
    statusNotification: StatusNotificationDto,
  ): Promise<StationStatusNotificationResult> {
    const stationId = await resolveStationIdOrThrow(
      tenantId,
      ocppConnectionName,
      'record a station-wide status notification',
    );
    return await this.s.transaction(async (transaction) => {
      const saved = await this.insertStatusNotification(
        tenantId,
        stationId,
        statusNotification,
        transaction,
      );
      const connectors = await this.updateAllConnectorsByStationId(
        tenantId,
        stationId,
        { ...connector, latestStatusNotificationId: saved.id },
        transaction,
      );
      return { statusNotification: saved, connectors };
    });
  }

  private async linkStatusNotificationToConnector(
    tenantId: number,
    ocppConnectionName: string,
    stationId: number | undefined,
    connector: Connector | undefined,
    statusNotification: StatusNotificationDto,
    transaction: Transaction,
  ): Promise<ConnectorStatusNotificationResult> {
    if (connector?.id === undefined) {
      throw new Error(`Failed to save the connector reported by ${ocppConnectionName}`);
    }

    const saved = await this.insertStatusNotification(
      tenantId,
      stationId,
      { ...statusNotification, connectorDatabaseId: connector.id },
      transaction,
    );
    const [linked] = await this.connector.updateAllByQuery(
      tenantId,
      { latestStatusNotificationId: saved.id },
      { where: { id: connector.id }, transaction },
    );
    if (!linked) {
      throw new Error(`Failed to save the connector reported by ${ocppConnectionName}`);
    }
    return { statusNotification: saved, connector: linked };
  }

  private async insertStatusNotification(
    tenantId: number,
    stationId: number | undefined,
    statusNotification: StatusNotificationDto,
    transaction: Transaction,
  ): Promise<StatusNotification> {
    return await StatusNotification.build({
      tenantId,
      stationId,
      timestamp: statusNotification.timestamp,
      connectorStatus: statusNotification.connectorStatus,
      evseId: statusNotification.evseId,
      connectorId: statusNotification.connectorId,
      connectorDatabaseId: statusNotification.connectorDatabaseId,
      errorCode: statusNotification.errorCode,
      info: statusNotification.info,
      vendorId: statusNotification.vendorId,
      vendorErrorCode: statusNotification.vendorErrorCode,
    }).save({ transaction });
  }

  async getChargingStationsByIds(
    tenantId: number,
    stationNames: string[],
  ): Promise<ChargingStation[]> {
    const query = {
      where: {
        ocppConnectionName: {
          [Op.in]: stationNames,
        },
      },
    };

    return this.chargingStation.readAllByQuery(tenantId, query);
  }

  async createOrUpdateLocationWithChargingStations(
    tenantId: number,
    location: Partial<Location>,
  ): Promise<Location> {
    location.tenantId = tenantId;
    let savedLocation;
    if (location.id) {
      const result = await this.readOrCreateByQuery(tenantId, {
        where: {
          tenantId,
          id: location.id,
        },
        defaults: {
          name: location.name,
          address: location.address,
          city: location.city,
          postalCode: location.postalCode,
          state: location.state,
          country: location.country,
          coordinates: location.coordinates,
        },
      });

      savedLocation = result[0];
      const locationCreated = result[1];

      if (!locationCreated) {
        const values: Partial<Location> = {};
        values.name = location.name ?? undefined;
        values.address = location.address ?? undefined;
        values.city = location.city ?? undefined;
        values.postalCode = location.postalCode ?? undefined;
        values.state = location.state ?? undefined;
        values.country = location.country ?? undefined;
        values.coordinates = location.coordinates ?? undefined;

        await this.updateByKey(tenantId, { ...values }, savedLocation.id);
      }
    } else {
      savedLocation = await this.create(tenantId, Location.build({ ...location }));
    }

    if (location.chargingPool && location.chargingPool.length > 0) {
      for (const chargingStation of location.chargingPool) {
        chargingStation.locationId = savedLocation.id;
        await this.createOrUpdateChargingStation(tenantId, chargingStation);
      }
    }

    return savedLocation.reload({ include: ChargingStation });
  }

  async createOrUpdateChargingStation(
    tenantId: number,
    chargingStation: ChargingStationDto,
  ): Promise<ChargingStation> {
    chargingStation.tenantId = tenantId;
    if (chargingStation.ocppConnectionName) {
      const [savedChargingStation, chargingStationCreated] =
        await this.chargingStation.readOrCreateByQuery(tenantId, {
          where: {
            tenantId,
            ocppConnectionName: chargingStation.ocppConnectionName,
          },
          defaults: {
            locationId: chargingStation.locationId,
            chargePointVendor: chargingStation.chargePointVendor,
            chargePointModel: chargingStation.chargePointModel,
            chargePointSerialNumber: chargingStation.chargePointSerialNumber,
            chargeBoxSerialNumber: chargingStation.chargeBoxSerialNumber,
            firmwareVersion: chargingStation.firmwareVersion,
            iccid: chargingStation.iccid,
            imsi: chargingStation.imsi,
            meterType: chargingStation.meterType,
            meterSerialNumber: chargingStation.meterSerialNumber,
          },
        });
      if (!chargingStationCreated) {
        await savedChargingStation.update({
          locationId: chargingStation.locationId,
          chargePointVendor: chargingStation.chargePointVendor,
          chargePointModel: chargingStation.chargePointModel,
          chargePointSerialNumber: chargingStation.chargePointSerialNumber,
          chargeBoxSerialNumber: chargingStation.chargeBoxSerialNumber,
          firmwareVersion: chargingStation.firmwareVersion,
          iccid: chargingStation.iccid,
          imsi: chargingStation.imsi,
          meterType: chargingStation.meterType,
          meterSerialNumber: chargingStation.meterSerialNumber,
        });
      }

      return savedChargingStation;
    } else {
      return await this.chargingStation.create(
        tenantId,
        ChargingStation.build({ ...chargingStation }),
      );
    }
  }

  async createOrUpdateEvse(tenantId: number, evse: EvseDto): Promise<EvseDto> {
    let result;
    await this.s.transaction(async (sequelizeTransaction) => {
      const [savedEvse, evseCreated] = await this.evse.readOrCreateByQuery(tenantId, {
        where: {
          tenantId,
          stationId: evse.stationId,
          evseTypeId: evse.evseTypeId,
        },
        defaults: { ...evse },
        transaction: sequelizeTransaction,
      });
      if (!evseCreated) {
        const updatedEvses = await this.evse.updateAllByQuery(tenantId, evse, {
          where: {
            id: savedEvse.id,
          },
          transaction: sequelizeTransaction,
        });
        result = updatedEvses.length > 0 ? updatedEvses[0] : undefined;
      } else {
        result = savedEvse;
      }
    });
    return result!;
  }

  async createOrUpdateOcpp16Connector(
    tenantId: number,
    connector: ConnectorDto & { connectorId: number },
  ): Promise<ConnectorDto | undefined> {
    return await this.upsertConnector(tenantId, connector, {
      tenantId,
      stationId: connector.stationId,
      connectorId: connector.connectorId,
    });
  }

  async createOrUpdateOcpp2Connector(
    tenantId: number,
    connector: ConnectorDto & { evseTypeConnectorId: number },
  ): Promise<ConnectorDto | undefined> {
    return await this.upsertConnector(tenantId, connector, {
      tenantId,
      evseId: connector.evseId,
      evseTypeConnectorId: connector.evseTypeConnectorId,
    });
  }

  private async upsertConnector(
    tenantId: number,
    connector: ConnectorDto,
    where: WhereOptions<Connector>,
    outerTransaction?: Transaction,
  ): Promise<Connector | undefined> {
    const upsert = async (transaction: Transaction): Promise<Connector | undefined> => {
      const [savedConnector, connectorCreated] = await this.connector.readOrCreateByQuery(
        tenantId,
        {
          where,
          defaults: { ...connector },
          transaction,
        },
      );
      if (connectorCreated) {
        return savedConnector;
      }
      const [updatedConnector] = await this.connector.updateAllByQuery(tenantId, connector, {
        where: {
          id: savedConnector.id,
        },
        transaction,
      });
      return updatedConnector;
    };
    return outerTransaction ? await upsert(outerTransaction) : await this.s.transaction(upsert);
  }

  async updateAllConnectorsByStationId(
    tenantId: number,
    stationId: number,
    value: Partial<ConnectorDto>,
    transaction?: Transaction,
  ): Promise<Connector[]> {
    return await this.connector.updateAllByQuery(tenantId, value, {
      where: { stationId, tenantId },
      transaction,
    });
  }

  async autoCommissionEvseForOcpp16Connector(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<{ evseId: number }> {
    // OCPP 1.6 has no native EVSE concept. Conservative default: each connector
    // maps to its own Evse
    const stationId = await resolveStationIdOrThrow(
      tenantId,
      ocppConnectionName,
      'auto-commission an EVSE',
    );
    const evse = await Evse.create({ tenantId, stationId });
    return { evseId: evse.id };
  }

  async updateChargingStationTimestamp(
    tenantId: number,
    ocppConnectionName: string,
    timestamp: string,
  ): Promise<void> {
    await this.chargingStation.updateAllByQuery(
      tenantId,
      { latestOcppMessageTimestamp: timestamp },
      {
        where: {
          ocppConnectionName: ocppConnectionName,
          [Op.or]: [
            { latestOcppMessageTimestamp: null },
            { latestOcppMessageTimestamp: { [Op.lt]: timestamp } },
          ],
        },
      },
    );
  }

  async readConnectorByStationIdAndOcpp16ConnectorId(
    tenantId: number,
    ocppConnectionName: string,
    ocpp16ConnectorId: number,
  ): Promise<Connector | undefined> {
    return (
      (await Connector.findOne({
        where: {
          tenantId,
          stationId: await stationIdFilter(tenantId, ocppConnectionName),
          connectorId: ocpp16ConnectorId,
        },
        include: [Evse],
      })) ?? undefined
    );
  }

  async readEvseByStationIdAndOcpp201EvseId(
    tenantId: number,
    ocppConnectionName: string,
    ocpp201EvseId: number,
  ): Promise<Evse | undefined> {
    return (
      (await Evse.findOne({
        where: {
          stationId: await stationIdFilter(tenantId, ocppConnectionName),
          evseTypeId: ocpp201EvseId,
          tenantId,
        },
        include: [Connector],
      })) ?? undefined
    );
  }

  async readConnectorByStationIdAndOcpp201EvseType(
    tenantId: number,
    ocppConnectionName: string,
    ocpp201EvseType: OCPP2_0_1.EVSEType,
  ): Promise<Connector | undefined> {
    return (
      (await Connector.findOne({
        where: {
          tenantId,
          stationId: await stationIdFilter(tenantId, ocppConnectionName),
          evseTypeConnectorId: ocpp201EvseType.connectorId,
        },
        include: [{ model: Evse, where: { evseTypeId: ocpp201EvseType.id }, required: true }],
      })) ?? undefined
    );
  }

  async readConnectorsByStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<ConnectorDto[]> {
    return await this.connector.readAllByQuery(tenantId, {
      where: { tenantId, stationId: await stationIdFilter(tenantId, ocppConnectionName) },
      include: [{ model: Evse, as: 'evse' }],
    });
  }

  async readConnectorsWithTariffsByStationId(
    tenantId: number,
    ocppConnectionName: string,
    evseTypeId?: number,
  ): Promise<ConnectorDto[]> {
    return await this.connector.readAllByQuery(tenantId, {
      where: {
        tenantId,
        stationId: await stationIdFilter(tenantId, ocppConnectionName),
        tariffId: { [Op.ne]: null },
      },
      include: [
        {
          model: Evse,
          as: 'evse',
          required: true,
          ...(evseTypeId !== undefined && { where: { evseTypeId } }),
        },
        {
          model: Tariff,
          as: 'tariff',
          required: true,
        },
      ],
    });
  }
}

export default SequelizeLocationRepository;
