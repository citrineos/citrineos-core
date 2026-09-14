// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ChargingStationSequenceTypeEnumType } from '@citrineos/types';
import type { IChargingStationSequenceRepository } from '@citrineos/dal';

export class IdGenerator {
  private _stationSequenceRepository: IChargingStationSequenceRepository;

  constructor({
    chargingStationSequenceRepository,
  }: {
    chargingStationSequenceRepository: IChargingStationSequenceRepository;
  }) {
    this._stationSequenceRepository = chargingStationSequenceRepository;
  }

  async generateRequestId(
    tenantId: number,
    ocppConnectionName: string,
    type: ChargingStationSequenceTypeEnumType,
  ): Promise<number> {
    return this._stationSequenceRepository.getNextSequenceValue(tenantId, ocppConnectionName, type);
  }
}

export default IdGenerator;
