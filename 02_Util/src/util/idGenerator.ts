// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ChargingStationSequenceTypeEnumType } from '@citrineos/base';
import type { IChargingStationSequenceRepository } from '@citrineos/data';

export class IdGenerator {
  private _stationSequenceRepository: IChargingStationSequenceRepository;

  constructor(stationSequenceRepository: IChargingStationSequenceRepository) {
    this._stationSequenceRepository = stationSequenceRepository;
  }

  async generateRequestId(
    tenantId: number,
    stationId: string,
    type: ChargingStationSequenceTypeEnumType,
  ): Promise<number> {
    return this._stationSequenceRepository.getNextSequenceValue(tenantId, stationId, type);
  }
}
