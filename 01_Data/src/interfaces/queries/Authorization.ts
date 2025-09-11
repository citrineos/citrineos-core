// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QuerySchema } from '@citrineos/base';

export interface AuthorizationQuerystring {
  idToken: string;
  type: string | null;
}

export const AuthorizationQuerySchema = QuerySchema('AuthorizationQuerySchema', [
  {
    key: 'idToken',
    type: 'string',
    required: true,
  },
  {
    key: 'type',
    type: 'string',
    required: true,
  },
]);
