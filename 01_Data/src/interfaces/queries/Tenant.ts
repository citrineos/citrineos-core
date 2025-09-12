// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, QuerySchema } from '@citrineos/base';

export const TenantQuerySchema = QuerySchema('TenantQuerySchema', [
  {
    key: 'tenantId',
    type: 'number',
    required: true,
    defaultValue: String(DEFAULT_TENANT_ID),
  },
]);

export interface TenantQueryString {
  tenantId: number;
}
