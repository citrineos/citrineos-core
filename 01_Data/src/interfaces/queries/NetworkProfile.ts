// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { DEFAULT_TENANT_ID, QuerySchema } from '@citrineos/base';

export interface NetworkProfileQuerystring {
  stationId: string;
  tenantId: number;
}

export const NetworkProfileQuerySchema = QuerySchema('NetworkProfileQuerySchema', [
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

export interface NetworkProfileDeleteQuerystring {
  stationId: string;
  configurationSlot: number[];
  tenantId: number;
}

export const NetworkProfileDeleteQuerySchema = QuerySchema('NetworkProfileDeleteQuerySchema', [
  {
    key: 'stationId',
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
