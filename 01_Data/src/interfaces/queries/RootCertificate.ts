// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export const RootCertificateSchema = QuerySchema(
  [
    ['stationId', 'string'],
    ['certificateType', 'string'],
    ['tenantId', 'string'],
    ['callbackUrl', 'string'],
    ['serialNumber', 'string'],
    ['keyLength', 'number'],
    ['organizationName', 'string'],
    ['commonName', 'string'],
    ['validBefore', 'string'],
    ['filePath', 'string'],
    ['certificateFileId', 'string'],
    ['privateKeyFileId', 'string'],
    ['selfSigned', 'boolean'],
  ],
  ['stationId', 'certificateType'],
);
