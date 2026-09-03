// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, QuerySchema } from '@citrineos/base';

export interface ChargingStationKeyQuerystring {
  ocppConnectionName: string;
  tenantId: number;
}

export const ChargingStationKeyQuerySchema = QuerySchema('ChargingStationKeyQuerySchema', [
  {
    key: 'ocppConnectionName',
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
