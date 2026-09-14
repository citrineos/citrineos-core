// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QuerySchema, DEFAULT_TENANT_ID } from '@citrineos/base';

export interface ModelKeyQuerystring {
  id: number;
  tenantId: number;
}

export const ModelKeyQuerystringSchema = QuerySchema('ModelKeyQuerystringSchema', [
  {
    key: 'id',
    type: 'number',
    required: true,
  },
  {
    key: 'tenantId',
    type: 'number',
    required: true,
    defaultValue: String(DEFAULT_TENANT_ID),
  },
]);
