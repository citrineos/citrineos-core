// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export const GenerateCertificateChainSchema = QuerySchema(
  [
    ['serialNumber', 'string'],
    ['keyLength', 'number'],
    ['organizationName', 'string'],
    ['commonName', 'string'],
    ['validBefore', 'string'],
    ['filePath', 'string'],
    ['selfSigned', 'boolean'],
  ],
  ['selfSigned', 'commonName', 'organizationName'],
);

export const InstallRootCertificateSchema = QuerySchema(
  [
    ['stationId', 'string'],
    ['certificateType', 'string'],
    ['tenantId', 'string'],
    ['callbackUrl', 'string'],
    ['fileId', 'string'],
  ],
  ['stationId', 'certificateType', 'tenantId'],
);
