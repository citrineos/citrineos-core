// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
import {
  ChargingStationSequenceType,
  IChargingStationSequenceRepository,
} from '@citrineos/data';

export class IdGenerator {
  private _stationSequenceRepository: IChargingStationSequenceRepository;

  constructor(stationSequenceRepository: IChargingStationSequenceRepository) {
    this._stationSequenceRepository = stationSequenceRepository;
  }

  async generateRequestId(
    stationId: string,
    type: ChargingStationSequenceType,
  ): Promise<number> {
    return this._stationSequenceRepository.getNextSequenceValue(
      stationId,
      type,
    );
  }
  async generateRemoteStartId(stationId: string): Promise<number> {
    return this._stationSequenceRepository.getNextSequenceValue(
      stationId,
      'remoteStartId',
    );
  }
}
