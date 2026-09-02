// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, QuerySchema } from '@citrineos/base';

export interface NetworkProfileQuerystring {
  ocppConnectionName: string;
  tenantId: number;
}

export const NetworkProfileQuerySchema = QuerySchema('NetworkProfileQuerySchema', [
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

export interface NetworkProfileDeleteQuerystring {
  ocppConnectionName: string;
  configurationSlot: number[];
  tenantId: number;
}

export const NetworkProfileDeleteQuerySchema = QuerySchema('NetworkProfileDeleteQuerySchema', [
  {
    key: 'ocppConnectionName',
    type: 'string',
    required: true,
  },
  {
    key: 'configurationSlot',
    type: 'number[]',
    required: true,
  },
  {
    key: 'tenantId',
    type: 'number',
    required: true,
    defaultValue: String(DEFAULT_TENANT_ID),
  },
]);
