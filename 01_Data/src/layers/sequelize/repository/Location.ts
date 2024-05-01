// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, SystemConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';
import { ChargingStation, Location, SequelizeRepository } from '..';
import { type ILocationRepository } from '../../..';

export class SequelizeLocationRepository extends SequelizeRepository<Location> implements ILocationRepository {
  chargingStation: CrudRepository<ChargingStation>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, namespace = Location.MODEL_NAME, sequelizeInstance?: Sequelize, chargingStation?: CrudRepository<ChargingStation>) {
    super(config, namespace, logger, sequelizeInstance);
    this.chargingStation = chargingStation ? chargingStation : new SequelizeRepository<ChargingStation>(config, ChargingStation.MODEL_NAME, logger, sequelizeInstance);
  }
  async readChargingStationByStationId(stationId: string): Promise<ChargingStation | undefined> {
    return await this.chargingStation.readByKey(stationId);
  }
}
