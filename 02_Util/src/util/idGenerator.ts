// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
import { IChargingStationSequenceRepository } from '@citrineos/data';
import { ChargingStationSequenceType } from '@citrineos/base';

export class IdGenerator {
  private _stationSequenceRepository: IChargingStationSequenceRepository;

  constructor(stationSequenceRepository: IChargingStationSequenceRepository) {
    this._stationSequenceRepository = stationSequenceRepository;
  }

  async generateRequestId(
    tenantId: number,
    stationId: string,
    type: ChargingStationSequenceType,
  ): Promise<number> {
    return this._stationSequenceRepository.getNextSequenceValue(tenantId, stationId, type);
  }
}
