// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, QuerySchema } from '@citrineos/base';

export interface ChargingStationKeyQuerystring {
  stationId: string;
  tenantId: number;
}

export const ChargingStationKeyQuerySchema = QuerySchema('ChargingStationKeyQuerySchema', [
  {
    key: 'stationId',
    type: 'string',
    required: true,
  },
  {
    key: 'tenantId',
    type: 'number',
    required: true,
    defaultValue: String(DEFAULT_TENANT_ID),
  },
]);
