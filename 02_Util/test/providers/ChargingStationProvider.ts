// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { ChargingStation } from '@citrineos/data';
import { faker } from '@faker-js/faker';

export function aChargingStation(override?: Partial<ChargingStation>): ChargingStation {
  return {
    id: faker.string.uuid().toString(),
    isOnline: true,
    ...override,
  } as ChargingStation;
}
