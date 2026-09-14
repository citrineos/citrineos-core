// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QuerySchema } from '@citrineos/base';

export interface AuthorizationQuerystring {
  idToken?: string | null | undefined;
  type?: string | null | undefined;
  id?: number | null | undefined;
}

export const AuthorizationQuerySchema = QuerySchema('AuthorizationQuerySchema', [
  {
    key: 'idToken',
    type: 'string',
    required: false,
  },
  {
    key: 'type',
    type: 'string',
    required: false,
  },
  {
    key: 'id',
    type: 'number',
    required: false,
  },
]);
