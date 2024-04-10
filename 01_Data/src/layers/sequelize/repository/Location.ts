// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ChargingStation, type Location, SequelizeRepository } from '..';
import { type ILocationRepository } from '../../..';

export class LocationRepository extends SequelizeRepository<Location> implements ILocationRepository {
  async readChargingStationByStationId (stationId: string): Promise<ChargingStation | null> {
    return await ChargingStation.findByPk(stationId);
  }
}
