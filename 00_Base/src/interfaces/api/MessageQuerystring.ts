// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { DEFAULT_TENANT_ID } from '../../config/defineConfig';

/**
 * The message querystring interface, used for every OCPP message endpoint to validate query parameters.
 */
export interface IMessageQuerystring {
  identifier: string | string[];
  tenantId?: number;
  callbackUrl?: string;
}

/**
 * This message querystring schema describes the {@link IMessageQuerystring} interface.
 */
export const IMessageQuerystringSchema = {
  $id: 'MessageQuerystring',
  type: 'object',
  properties: {
    identifier: {
      anyOf: [
        { type: 'string' },
        {
          type: 'array',
          items: { type: 'string' },
        },
      ],
    },
    tenantId: { type: 'number', default: DEFAULT_TENANT_ID },
    callbackUrl: { type: 'string' },
  },
  required: ['identifier', 'tenantId'],
};
