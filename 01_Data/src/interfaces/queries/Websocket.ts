// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export interface WebsocketGetQuerystring {
  id?: string;
  tenantId?: number;
}

export const WebsocketGetQuerySchema = QuerySchema('WebsocketGetQuerySchema', [
  ['id', 'string'],
  ['tenantId', 'string'],
]);

export interface WebsocketDeleteQuerystring {
  id: string;
}

export const WebsocketDeleteQuerySchema = QuerySchema(
  'WebsocketDeleteQuerySchema',
  [['id', 'string']],
  ['id'],
);

export const WebsocketRequestSchema = QuerySchema(
  'WebsocketRequestSchema',
  [
    ['id', 'string'],
    ['host', 'string'],
    ['port', 'number'],
    ['pingInterval', 'number'],
    ['protocol', 'string'],
    ['securityProfile', 'number'],
    ['allowUnknownChargingStations', 'boolean'],
    ['tlsKeyFilePath', 'string'],
    ['tlsCertificateChainFilePath', 'string'],
    ['mtlsCertificateAuthorityKeyFilePath', 'string'],
    ['rootCACertificateFilePath', 'string'],
  ],
  [
    'id',
    'host',
    'port',
    'pingInterval',
    'protocol',
    'securityProfile',
    'allowUnknownChargingStations',
  ],
);
