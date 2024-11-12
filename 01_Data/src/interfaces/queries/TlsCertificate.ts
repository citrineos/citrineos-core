// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export const TlsCertificateSchema = QuerySchema(
  'TlsCertificateSchema',
  [
    ['certificateChain', 'array'],
    ['privateKey', 'string'],
    ['rootCA', 'string'],
    ['subCAKey', 'string'],
  ],
  ['certificateChain', 'privateKey'],
);

export const UpdateTlsCertificateQuerySchema = QuerySchema('UpdateTlsCertificateQuerySchema', [['id', 'string']], ['id']);

export interface UpdateTlsCertificateQueryString {
  id: string; // websocket server id
}
