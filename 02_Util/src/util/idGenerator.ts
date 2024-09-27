// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {IChargingStationSequenceRepository} from "@citrineos/data";

export class IdGenerator {

  private _stationSequenceRepository: IChargingStationSequenceRepository;

  constructor(stationSequenceRepository: IChargingStationSequenceRepository) {
    this._stationSequenceRepository = stationSequenceRepository;
  }

  async generateRequestId(stationId: string): Promise<number> {
    return this._stationSequenceRepository.getNextSequenceValue(stationId, 'requestId');
  }

}