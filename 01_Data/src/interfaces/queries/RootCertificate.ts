// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { DEFAULT_TENANT_ID, QuerySchema } from '@citrineos/base';

export const GenerateCertificateChainSchema = QuerySchema('GenerateCertificateChainSchema', [
  {
    key: 'commonName',
    type: 'string',
    required: true,
  },
  {
    key: 'organizationName',
    type: 'string',
    required: true,
  },
  {
    key: 'selfSigned',
    type: 'boolean',
    required: true,
  },
  {
    key: 'countryName',
    type: 'string',
  },
  {
    key: 'filePath',
    type: 'string',
  },
  {
    key: 'keyLength',
    type: 'number',
  },
  {
    key: 'pathLen',
    type: 'number',
  },
  {
    key: 'signatureAlgorithm',
    type: 'string',
  },
  {
    key: 'validBefore',
    type: 'string',
  },
]);

export const InstallRootCertificateSchema = QuerySchema('InstallRootCertificateSchema', [
  {
    key: 'certificateType',
    type: 'string',
    required: true,
  },
  {
    key: 'stationId',
    type: 'string',
    required: true,
  },
  {
    key: 'tenantId',
    type: 'number',
    required: true,
    defaultValue: String(DEFAULT_TENANT_ID),
  },
  {
    key: 'callbackUrl',
    type: 'string',
  },
  {
    key: 'fileId',
    type: 'string',
  },
]);
