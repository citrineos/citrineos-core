// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { DEFAULT_TENANT_ID, QuerySchema } from '@citrineos/base';

export interface TransactionEventQuerystring {
  stationId: string;
  transactionId: string;
  tenantId: number;
}

export const TransactionEventQuerySchema = QuerySchema('TransactionEventQuerySchema', [
  {
    key: 'stationId',
    type: 'string',
    required: true,
  },
  {
    key: 'transactionId',
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
