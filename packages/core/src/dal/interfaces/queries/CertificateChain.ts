// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';

export interface GenerateCertificateChainQueryString {
  tenantId: number;
  serverId: string | string[];
}

export const GenerateCertificateChainQuerySchema = {
  $id: 'GenerateCertificateChainQuerySchema',
  type: 'object',
  properties: {
    tenantId: { type: 'number', default: DEFAULT_TENANT_ID },
    serverId: {
      anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' }, minItems: 1 }],
    },
  },
  required: ['tenantId', 'serverId'],
};
