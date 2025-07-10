// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, OCPPVersion, BootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { ChargingStation, Connector, Location, SequelizeRepository, StatusNotification } from '..';
import { type ILocationRepository } from '../../..';
import { Op } from 'sequelize';
import { LatestStatusNotification } from '../model/Location/LatestStatusNotification';

export class SequelizeLocationRepository
  extends SequelizeRepository<Location>
  implements ILocationRepository
{
  chargingStation: CrudRepository<ChargingStation>;
  statusNotification: CrudRepository<StatusNotification>;
  latestStatusNotification: CrudRepository<LatestStatusNotification>;
  connector: CrudRepository<Connector>;

  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    sequelizeInstance?: Sequelize,
    chargingStation?: CrudRepository<ChargingStation>,
    statusNotification?: CrudRepository<StatusNotification>,
    latestStatusNotification?: CrudRepository<LatestStatusNotification>,
    connector?: CrudRepository<Connector>,
  ) {
    super(config, Location.MODEL_NAME, logger, sequelizeInstance);
    this.chargingStation = chargingStation
      ? chargingStation
      : new SequelizeRepository<ChargingStation>(
          config,
          ChargingStation.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.statusNotification = statusNotification
      ? statusNotification
      : new SequelizeRepository<StatusNotification>(
          config,
          StatusNotification.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.latestStatusNotification = latestStatusNotification
      ? latestStatusNotification
      : new SequelizeRepository<LatestStatusNotification>(
          config,
          LatestStatusNotification.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.connector = connector
      ? connector
      : new SequelizeRepository<Connector>(config, Connector.MODEL_NAME, logger, sequelizeInstance);
  }

  async readLocationById(tenantId: number, id: number): Promise<Location | undefined> {
    return await this.readOnlyOneByQuery(tenantId, {
      where: { id },
      include: [ChargingStation],
    });
  }

  async readChargingStationByStationId(
    tenantId: number,
    stationId: string,
  ): Promise<ChargingStation | undefined> {
    return await this.chargingStation.readByKey(tenantId, stationId);
  }

  async setChargingStationIsOnlineAndOCPPVersion(
    tenantId: number,
    stationId: string,
    isOnline: boolean,
    ocppVersion: OCPPVersion | null,
  ): Promise<ChargingStation | undefined> {
    return await this.chargingStation.updateByKey(
      tenantId,
      { isOnline: isOnline, protocol: ocppVersion },
      stationId,
    );
  }

  async doesChargingStationExistByStationId(tenantId: number, stationId: string): Promise<boolean> {
    return await this.chargingStation.existsByKey(tenantId, stationId);
  }

  async addStatusNotificationToChargingStation(
    tenantId: number,
    stationId: string,
    statusNotification: StatusNotification,
  ): Promise<void> {
    const savedStatusNotification = await this.statusNotification.create(
      tenantId,
      statusNotification,
    );
    try {
      await this.updateLatestStatusNotification(tenantId, stationId, savedStatusNotification);
    } catch (e: any) {
      this.logger.error(`Failed to update latest status notification with error: ${e.message}`, e);
    }
  }

  async updateLatestStatusNotification(
    tenantId: number,
    stationId: string,
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
          stationId,
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
        stationId,
        id: {
          [Op.in]: idsToDelete,
        },
      },
    });
    await this.latestStatusNotification.create(
      tenantId,
      LatestStatusNotification.build({
        tenantId,
        stationId,
        statusNotificationId,
      }),
    );
  }

  async getChargingStationsByIds(
    tenantId: number,
    stationIds: string[],
  ): Promise<ChargingStation[]> {
    const query = {
      where: {
        id: {
          [Op.in]: stationIds,
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
    chargingStation: ChargingStation,
  ): Promise<ChargingStation> {
    chargingStation.tenantId = tenantId;
    if (chargingStation.id) {
      const [savedChargingStation, chargingStationCreated] =
        await this.chargingStation.readOrCreateByQuery(tenantId, {
          where: {
            tenantId,
            id: chargingStation.id,
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
        await this.chargingStation.updateByKey(
          tenantId,
          {
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
          savedChargingStation.id,
        );
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
            stationId: connector.stationId,
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
}
