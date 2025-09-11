// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { DEFAULT_TENANT_ID, QuerySchema } from '@citrineos/base';

export const TariffQuerySchema = QuerySchema('TariffQuerySchema', [
  {
    key: 'tenantId',
    type: 'number',
    required: true,
    defaultValue: String(DEFAULT_TENANT_ID),
  },
  {
    key: 'id',
    type: 'string',
  },
]);

export interface TariffQueryString {
  tenantId: number;
  id?: string;
}
