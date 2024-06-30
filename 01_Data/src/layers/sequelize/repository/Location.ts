// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, StatusNotificationRequest, SystemConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';
import { ChargingStation, Location, SequelizeRepository } from '..';
import { type ILocationRepository } from '../../..';
import { StatusNotification } from '../model/Location/StatusNotification';

export class SequelizeLocationRepository extends SequelizeRepository<Location> implements ILocationRepository {
  chargingStation: CrudRepository<ChargingStation>;
  statusNotification: CrudRepository<StatusNotification>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize, chargingStation?: CrudRepository<ChargingStation>, statusNotification?: CrudRepository<StatusNotification>) {
    super(config, Location.MODEL_NAME, logger, sequelizeInstance);
    this.chargingStation = chargingStation ? chargingStation : new SequelizeRepository<ChargingStation>(config, ChargingStation.MODEL_NAME, logger, sequelizeInstance);
    this.statusNotification = statusNotification ? statusNotification : new SequelizeRepository<StatusNotification>(config, StatusNotification.MODEL_NAME, logger, sequelizeInstance);
  }

  async readChargingStationByStationId(stationId: string): Promise<ChargingStation | undefined> {
    return await this.chargingStation.readByKey(stationId);
  }

  async addStatusNotificationToChargingStation(stationId: string, statusNotification: StatusNotificationRequest): Promise<void> {
    this.statusNotification.create(StatusNotification.build({
      stationId,
      ...statusNotification
    }));
  }
}
