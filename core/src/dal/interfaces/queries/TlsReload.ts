// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { QuerySchema } from '@citrineos/base';

export const TlsReloadQuerySchema = QuerySchema('TlsReloadQuerySchema', [
  {
    key: 'serverId',
    type: 'string',
    required: true,
  },
]);

export interface TlsReloadQueryString {
  serverId: string;
}
