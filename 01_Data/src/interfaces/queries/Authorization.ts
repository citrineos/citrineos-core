// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export interface AuthorizationQuerystring {
  idToken: string;
  type: string | null;
}

export const AuthorizationQuerySchema = QuerySchema(
  'AuthorizationQuerySchema',
  [
    ['idToken', 'string'],
    ['type', 'string'],
  ],
  ['idToken', 'type'],
);
