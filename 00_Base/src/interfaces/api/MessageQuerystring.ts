// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * The message querystring interface, used for every OCPP message endpoint to validate query parameters.
 */
export interface IMessageQuerystring {
  identifier: string;
  tenantId: string;
  callbackUrl?: string;
}

/**
 * This message querystring schema describes the {@link IMessageQuerystring} interface.
 */
export const IMessageQuerystringSchema = {
  $id: 'MessageQuerystring',
  type: 'object',
  properties: {
    identifier: { type: 'string' },
    tenantId: { type: 'string' },
    callbackUrl: { type: 'string' },
  },
  required: ['identifier', 'tenantId'],
};
