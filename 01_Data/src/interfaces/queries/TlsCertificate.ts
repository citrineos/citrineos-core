// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export const TlsCertificateSchema = QuerySchema(
  [
    ['contentType', 'string'],
    ['certificateChain', 'string'],
    ['privateKey', 'string'],
    ['rootCA', 'string'],
    ['subCAKey', 'string'],
  ],
  ['contentType', 'certificateChain', 'privateKey'],
);

export const UpdateTlsCertificateQuerySchema = QuerySchema([['id', 'string']], ['id']);

export interface UpdateTlsCertificateQueryString {
  id: string; // websocket server id
}
