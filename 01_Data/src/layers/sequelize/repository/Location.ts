// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ChargingStation, Location, SequelizeRepository } from "..";
import { ILocationRepository } from "../../..";



export class LocationRepository extends SequelizeRepository<Location> implements ILocationRepository {
    readChargingStationByStationId(stationId: string): Promise<ChargingStation | null> {
        return ChargingStation.findByPk(stationId);
    }
}
