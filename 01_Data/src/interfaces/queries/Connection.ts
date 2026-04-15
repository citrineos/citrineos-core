// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QuerySchema } from '@citrineos/base';

export interface ConnectionDeleteQuerystring {
  stationId: string;
  tenantId: number;
}

export const ConnectionDeleteQuerySchema = QuerySchema('ConnectionDeleteQuerySchema', [
  {
    key: 'stationId',
    type: 'string',
    required: true,
  },
  {
    key: 'tenantId',
    type: 'number',
    required: true,
  },
]);
