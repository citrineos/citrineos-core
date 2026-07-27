// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ChargingStationSequenceDto,
  ChargingStationSequenceTypeEnumType,
} from '@citrineos/types';

export class ChargingStationSequenceClass implements Partial<ChargingStationSequenceDto> {
  type!: ChargingStationSequenceTypeEnumType;
}
