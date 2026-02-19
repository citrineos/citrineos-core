// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { ChargingStation } from '@citrineos/data';

export const MOCK_CHARGING_STATION_ID = 'cp001';

export function aChargingStation(override?: Partial<ChargingStation>): ChargingStation {
  return {
    tenantId: DEFAULT_TENANT_ID,
    id: MOCK_CHARGING_STATION_ID,
    isOnline: false,
    ...override,
  } as unknown as ChargingStation;
}
