// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '../../util/identifiers.js';

/**
 * The message querystring interface, used for every OCPP message endpoint to validate query parameters.
 */
export interface IMessageQuerystring {
  identifier: string | string[];
  tenantId?: number;
  callbackUrl?: string;
  staleAfterSeconds?: number;
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
    // Seconds after which the Call is dropped if it has not reached the station; 0 never drops it.
    staleAfterSeconds: { type: 'integer', minimum: 0 },
  },
  required: ['identifier', 'tenantId'],
};
