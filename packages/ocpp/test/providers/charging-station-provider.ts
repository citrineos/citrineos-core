// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ChargingStationDto } from '@citrineos/types';
import { faker } from '@faker-js/faker';

export function aChargingStation(override?: Partial<ChargingStationDto>): ChargingStationDto {
  return {
    id: faker.string.uuid().toString(),
    isOnline: true,
    ...override,
  } as unknown as ChargingStationDto;
}
