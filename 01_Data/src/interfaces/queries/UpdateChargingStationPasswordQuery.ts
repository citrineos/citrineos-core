// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { DEFAULT_TENANT_ID, QuerySchema } from '@citrineos/base';

export const UpdateChargingStationPasswordQuerySchema = QuerySchema(
  'UpdateChargingStationPasswordQuerySchema',
  [
    {
      key: 'tenantId',
      type: 'number',
      required: true,
      defaultValue: String(DEFAULT_TENANT_ID),
    },
    {
      key: 'callbackUrl',
      type: 'string',
    },
  ],
);

export interface UpdateChargingStationPasswordQueryString {
  tenantId: number;
  callbackUrl?: string;
}
