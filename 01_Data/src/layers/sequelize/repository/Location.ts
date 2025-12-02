// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { CrudRepository, OCPPVersion, BootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import {
  ChargingStation,
  Connector,
  Evse,
  Location,
  SequelizeRepository,
  StatusNotification,
} from '..';
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
  evse: CrudRepository<Evse>;

  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    sequelizeInstance?: Sequelize,
    chargingStation?: CrudRepository<ChargingStation>,
    statusNotification?: CrudRepository<StatusNotification>,
    latestStatusNotification?: CrudRepository<LatestStatusNotification>,
    connector?: CrudRepository<Connector>,
    evse?: CrudRepository<Evse>,
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
    this.evse = evse
      ? evse
      : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);
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

  async createOrUpdateEvse(tenantId: number, evse: Evse): Promise<Evse | undefined> {
    evse.tenantId = tenantId;
    this.logger.debug('[LocationRepo] createOrUpdateEvse called', {
      tenantId,
      stationId: evse.stationId,
      evseTypeId: evse.evseTypeId,
      evseId: evse.evseId,
    });

    try {
      const savedEvse = await this.evse.readOnlyOneByQuery(tenantId, {
        where: {
          tenantId,
          stationId: evse.stationId,
          evseTypeId: evse.evseTypeId,
        },
      });

      if (!savedEvse) {
        this.logger.warn('[LocationRepo] EVSE not found, skipping creation', {
          tenantId,
          stationId: evse.stationId,
          evseTypeId: evse.evseTypeId,
        });
        return undefined;
      }

      this.logger.debug('[LocationRepo] EVSE exists, updating', {
        id: savedEvse.id,
      });

      await this.evse.updateByKey(
        tenantId,
        {
          evseId: evse.evseId,
          physicalReference: evse.physicalReference,
          removed: evse.removed,
        },
        savedEvse.id,
      );

      return savedEvse.reload();
    } catch (e: any) {
      this.logger.error(
        '[LocationRepo] createOrUpdateEvse failed',
        {
          tenantId,
          stationId: evse.stationId,
          evseTypeId: evse.evseTypeId,
          error: e?.message,
        },
        e,
      );
      throw e;
    }
  }

  async createOrUpdateConnector(
    tenantId: number,
    connector: Connector,
  ): Promise<Connector | undefined> {
    let result: Connector | undefined;
    this.logger.debug('[LocationRepo] createOrUpdateConnector called', {
      tenantId,
      stationId: connector.stationId,
      evseId: connector.evseId,
      evseTypeConnectorId: connector.evseTypeConnectorId,
      connectorId: connector.connectorId,
      status: (connector as any)?.status,
    });

    try {
      await this.s.transaction(async (sequelizeTransaction) => {
        // Determine keying strategy based on provided fields:
        // - For OCPP 2.0.1, connector.evseId and connector.evseTypeConnectorId are set and
        //   identify a connector uniquely within an EVSE.
        // - For OCPP 1.6, connectorId is unique within a station.
        const isOcpp201 =
          connector.evseId !== undefined &&
          connector.evseId !== null &&
          connector.evseTypeConnectorId !== undefined &&
          connector.evseTypeConnectorId !== null;

        const where = isOcpp201
          ? {
              tenantId,
              evseId: connector.evseId,
              // for OCPP 2.0.1, use evseTypeConnectorId as the unique key within the EVSE
              evseTypeConnectorId: connector.evseTypeConnectorId,
            }
          : {
              tenantId,
              stationId: connector.stationId,
              // for OCPP 1.6, use stationId + connectorId as the unique key
              connectorId: connector.connectorId,
            };

        this.logger.debug('[LocationRepo] createOrUpdateConnector key', {
          isOcpp201,
          where,
        });

        const [savedConnector, connectorCreated] = await this.connector.readOrCreateByQuery(
          tenantId,
          {
            where,
            defaults: {
              ...connector,
            },
            transaction: sequelizeTransaction,
          },
        );

        if (connectorCreated) {
          this.logger.info('[LocationRepo] Connector created', {
            id: savedConnector.id,
            where,
            stationId: connector.stationId,
          });
          result = savedConnector;
        } else {
          this.logger.debug('[LocationRepo] Connector exists, updating', {
            id: savedConnector.id,
          });
          const updatedConnectors = await this.connector.updateAllByQuery(tenantId, connector, {
            where: {
              id: savedConnector.id,
            },
            transaction: sequelizeTransaction,
          });
          result = updatedConnectors.length > 0 ? updatedConnectors[0] : undefined;
          this.logger.info('[LocationRepo] Connector updated', {
            id: savedConnector.id,
            updated: !!result,
          });
        }
      });
    } catch (e: any) {
      this.logger.error(
        '[LocationRepo] createOrUpdateConnector failed',
        {
          tenantId,
          stationId: connector.stationId,
          evseId: connector.evseId,
          evseTypeConnectorId: connector.evseTypeConnectorId,
          connectorId: connector.connectorId,
          error: e?.message,
        },
        e,
      );
      throw e;
    }
    return result;
  }
}
