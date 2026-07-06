// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationDto, OCPP2_0_1 } from '@citrineos/base';
import { CrudRepository, OCPPVersion } from '@citrineos/base';
import { Op } from 'sequelize';
import { type ILocationRepository } from '../../../interfaces/repositories.js';
import { EvseType } from '../model/DeviceModel/EvseType.js';
import { ChargingStation } from '../model/Location/ChargingStation.js';
import { Connector } from '../model/Location/Connector.js';
import { Evse } from '../model/Location/Evse.js';
import { LatestStatusNotification } from '../model/Location/LatestStatusNotification.js';
import { Location } from '../model/Location/Location.js';
import { StatusNotification } from '../model/Location/StatusNotification.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';

export class SequelizeLocationRepository
  extends SequelizeRepository<Location>
  implements ILocationRepository
{
  chargingStation: CrudRepository<ChargingStation>;
  statusNotification: CrudRepository<StatusNotification>;
  latestStatusNotification: CrudRepository<LatestStatusNotification>;
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
    this.latestStatusNotification = new SequelizeRepository<LatestStatusNotification>({
      config,
      namespace: LatestStatusNotification.MODEL_NAME,
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

  async readChargingStationByStationId(
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
  ): Promise<ChargingStation | undefined> {
    const station = await ChargingStation.findOne({
      where: { ocppConnectionName: ocppConnectionName, tenantId },
    });

    if (!station) {
      this.logger.error(
        `setChargingStationIsOnlineAndOCPPVersion: No charging station found for tenant ${tenantId} with ocppConnectionName ${ocppConnectionName}. Update skipped to prevent modifying a station from a different tenant.`,
      );
      return undefined;
    }

    await station.update({ isOnline, protocol: ocppVersion });
    return station;
  }

  async doesChargingStationExistByStationId(
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
    statusNotification: StatusNotification,
  ): Promise<void> {
    const savedStatusNotification = await this.statusNotification.create(
      tenantId,
      statusNotification,
    );
    try {
      await this.updateLatestStatusNotification(
        tenantId,
        ocppConnectionName,
        savedStatusNotification,
      );
    } catch (e: any) {
      this.logger.error(`Failed to update latest status notification with error: ${e.message}`, e);
    }
  }

  async updateLatestStatusNotification(
    tenantId: number,
    ocppConnectionName: string,
    statusNotification: StatusNotification,
  ): Promise<void> {
    const evseId = statusNotification.evseId;
    const connectorId = statusNotification.connectorId;
    const statusNotificationId = statusNotification.id;
    // delete operation doesn't support "include" in query
    // so we need to find them at first and then delete
    const existingLatestStatusNotifications: LatestStatusNotification[] =
      await this.latestStatusNotification.readAllByQuery(tenantId, {
        where: {
          ocppConnectionName: ocppConnectionName,
        },
        include: [
          {
            model: StatusNotification,
            where: {
              evseId,
              connectorId,
            },
            require: true,
          },
        ],
      });
    const idsToDelete = existingLatestStatusNotifications.map((l) => l.id);
    await this.latestStatusNotification.deleteAllByQuery(tenantId, {
      where: {
        ocppConnectionName: ocppConnectionName,
        id: {
          [Op.in]: idsToDelete,
        },
      },
    });
    await this.latestStatusNotification.create(
      tenantId,
      LatestStatusNotification.build({
        tenantId,
        ocppConnectionName: ocppConnectionName,
        statusNotificationId,
      }),
    );
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

  async createOrUpdateConnector(
    tenantId: number,
    connector: Connector,
  ): Promise<Connector | undefined> {
    let result;
    await this.s.transaction(async (sequelizeTransaction) => {
      const [savedConnector, connectorCreated] = await this.connector.readOrCreateByQuery(
        tenantId,
        {
          where: {
            tenantId,
            ocppConnectionName: connector.ocppConnectionName,
            connectorId: connector.connectorId,
          },
          defaults: {
            ...connector,
          },
          transaction: sequelizeTransaction,
        },
      );
      if (!connectorCreated) {
        const updatedConnectors = await this.connector.updateAllByQuery(tenantId, connector, {
          where: {
            id: savedConnector.id,
          },
          transaction: sequelizeTransaction,
        });
        result = updatedConnectors.length > 0 ? updatedConnectors[0] : undefined;
      } else {
        result = savedConnector;
      }
    });
    return result;
  }

  async updateAllConnectorsByQuery(
    tenantId: number,
    value: Partial<Connector>,
    query: object,
  ): Promise<Connector[]> {
    return await this.connector.updateAllByQuery(tenantId, value, query);
  }

  async commissionEvseForOcpp16Connector(
    tenantId: number,
    ocppConnectionName: string,
    connectorId: number,
  ): Promise<{ evseId: number; evseTypeConnectorId: number }> {
    return await this.s.transaction(async (sequelizeTransaction) => {
      // OCPP 1.6 has no native EVSE concept. Conservative default: each connector
      // maps to its own (Evse, EvseType) pair using the 1.6 connectorId as the
      // OCPP 2.0.1 evse id. EvseType.connectorId stays null because the EVSE
      // is implicit (single-connector hardware abstraction). The Evse's
      // stationId FK is auto-resolved from ocppConnectionName by the
      // BeforeCreate hook on the Evse model.
      const [evseType] = await EvseType.findOrCreate({
        where: { tenantId, id: connectorId, connectorId: null },
        defaults: { tenantId, id: connectorId, connectorId: null },
        transaction: sequelizeTransaction,
      });
      const [evse] = await Evse.findOrCreate({
        where: { tenantId, ocppConnectionName, evseTypeId: connectorId },
        defaults: { tenantId, ocppConnectionName, evseTypeId: connectorId },
        transaction: sequelizeTransaction,
      });
      return { evseId: evse.id, evseTypeConnectorId: evseType.databaseId };
    });
  }

  async updateChargingStationTimestamp(
    tenantId: number,
    ocppConnectionName: string,
    timestamp: string,
  ): Promise<void> {
    await this.chargingStation.updateAllByQuery(
      tenantId,
      { latestOcppMessageTimestamp: timestamp },
      { where: { ocppConnectionName: ocppConnectionName } },
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
          ocppConnectionName: ocppConnectionName,
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
          ocppConnectionName: ocppConnectionName,
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
          ocppConnectionName: ocppConnectionName,
          evseTypeConnectorId: ocpp201EvseType.connectorId,
        },
        include: [{ model: Evse, where: { evseTypeId: ocpp201EvseType.id }, required: true }],
      })) ?? undefined
    );
  }
}

export default SequelizeLocationRepository;
