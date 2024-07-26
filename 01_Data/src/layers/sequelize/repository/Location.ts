// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, StatusNotificationRequest, SystemConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';
import { ChargingStation, Location, SequelizeRepository } from '..';
import { type ILocationRepository } from '../../..';
import { StatusNotification } from '../model/Location';
import { Op } from 'sequelize';

export class SequelizeLocationRepository extends SequelizeRepository<Location> implements ILocationRepository {
  chargingStation: CrudRepository<ChargingStation>;
  statusNotification: CrudRepository<StatusNotification>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize, chargingStation?: CrudRepository<ChargingStation>, statusNotification?: CrudRepository<StatusNotification>) {
    super(config, Location.MODEL_NAME, logger, sequelizeInstance);
    this.chargingStation = chargingStation ? chargingStation : new SequelizeRepository<ChargingStation>(config, ChargingStation.MODEL_NAME, logger, sequelizeInstance);
    this.statusNotification = statusNotification ? statusNotification : new SequelizeRepository<StatusNotification>(config, StatusNotification.MODEL_NAME, logger, sequelizeInstance);
  }

  async readLocationById(id: number): Promise<Location | undefined> {
    return await this.readOnlyOneByQuery({
      where: { id },
      include: [ChargingStation],
    });
  }

  async readChargingStationByStationId(stationId: string): Promise<ChargingStation | undefined> {
    return await this.chargingStation.readByKey(stationId);
  }

  async addStatusNotificationToChargingStation(stationId: string, statusNotification: StatusNotificationRequest): Promise<void> {
    await this.statusNotification.create(
      StatusNotification.build({
        stationId,
        ...statusNotification,
      }),
    );
  }

  async getChargingStationsByIds(stationIds: string[]): Promise<ChargingStation[]> {
    const query = {
      where: {
        id: {
          [Op.in]: stationIds,
        },
      },
    };

    return this.chargingStation.readAllByQuery(query);
  }

  async createOrUpdateLocationWithChargingStations(location: Partial<Location>): Promise<Location> {
    let savedLocation;
    if (location.id) {
      const result = await this.readOrCreateByQuery({
        where: {
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

        await this.updateByKey({ ...values }, savedLocation.id);
      }
    } else {
      savedLocation = await this.create(Location.build({ ...location }));
    }

    if (location.chargingPool && location.chargingPool.length > 0) {
      for (const chargingStation of location.chargingPool) {
        chargingStation.locationId = savedLocation.id;
        await this.createOrUpdateChargingStation(chargingStation);
      }
    }

    return savedLocation.reload({ include: ChargingStation });
  }

  async createOrUpdateChargingStation(chargingStation: ChargingStation): Promise<ChargingStation> {
    if (chargingStation.id) {
      const [savedChargingStation, chargingStationCreated] = await this.chargingStation.readOrCreateByQuery({
        where: {
          id: chargingStation.id,
        },
        defaults: {
          id: chargingStation.id,
          locationId: chargingStation.locationId,
        },
      });
      if (!chargingStationCreated) {
        await this.chargingStation.updateByKey(
          {
            locationId: chargingStation.locationId,
          },
          savedChargingStation.id,
        );
      }

      return savedChargingStation;
    } else {
      return await this.chargingStation.create(ChargingStation.build({ ...chargingStation }));
    }
  }
}
