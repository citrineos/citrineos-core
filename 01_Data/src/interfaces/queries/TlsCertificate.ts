// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export const TlsCertificateSchema = QuerySchema('TlsCertificateSchema', [
  {
    key: 'certificateChain',
    type: 'string[]',
    required: true,
  },
  {
    key: 'privateKey',
    type: 'string',
    required: true,
  },
  {
    key: 'rootCA',
    type: 'string',
  },
  {
    key: 'subCAKey',
    type: 'string',
  },
]);

export const UpdateTlsCertificateQuerySchema = QuerySchema('UpdateTlsCertificateQuerySchema', [
  {
    key: 'id',
    type: 'string',
    required: true,
  },
]);

export interface UpdateTlsCertificateQueryString {
  id: string; // websocket server id
}
