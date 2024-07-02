// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, SystemConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';
import { ChargingStation, Location, SequelizeRepository } from '..';
import { type ILocationRepository } from '../../..';
import { Op } from 'sequelize';

export class SequelizeLocationRepository extends SequelizeRepository<Location> implements ILocationRepository {
  chargingStation: CrudRepository<ChargingStation>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize, chargingStation?: CrudRepository<ChargingStation>) {
    super(config, Location.MODEL_NAME, logger, sequelizeInstance);
    this.chargingStation = chargingStation ? chargingStation : new SequelizeRepository<ChargingStation>(config, ChargingStation.MODEL_NAME, logger, sequelizeInstance);
  }

  async readLocationById(id: number): Promise<Location | undefined> {
    return await this.readOnlyOneByQuery(
      {
        where: { id },
        include: [ChargingStation]
      }
    );
  }

  async readChargingStationByStationId(stationId: string): Promise<ChargingStation | undefined> {
    return await this.chargingStation.readByKey(stationId);
  }

  async getChargingStationsByIds(stationIds: string[]): Promise<ChargingStation[]> {
    const query = {
      where: {
        id: {
          [Op.in]: stationIds,
        },
      }
    };

    return this.chargingStation.readAllByQuery(query);
  }
}
