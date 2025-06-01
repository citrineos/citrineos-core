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
  {
    key: 'id',
    type: 'string',
  },
  {
    key: 'tenantId',
    type: 'string',
  },
]);

export interface WebsocketDeleteQuerystring {
  id: string;
}

export const WebsocketDeleteQuerySchema = QuerySchema('WebsocketDeleteQuerySchema', [
  {
    key: 'id',
    type: 'string',
    required: true,
  },
]);

export const WebsocketRequestSchema = QuerySchema('WebsocketRequestSchema', [
  {
    key: 'id',
    type: 'string',
    required: true,
  },
  {
    key: 'host',
    type: 'string',
    required: true,
  },
  {
    key: 'port',
    type: 'number',
    required: true,
  },
  {
    key: 'pingInterval',
    type: 'number',
    required: true,
  },
  {
    key: 'protocol',
    type: 'string',
    required: true,
  },
  {
    key: 'securityProfile',
    type: 'number',
    required: true,
  },
  {
    key: 'allowUnknownChargingStations',
    type: 'boolean',
    required: true,
  },
  {
    key: 'tlsKeyFilePath',
    type: 'string',
  },
  {
    key: 'tlsCertificateChainFilePath',
    type: 'string',
  },
  {
    key: 'mtlsCertificateAuthorityKeyFilePath',
    type: 'string',
  },
  {
    key: 'rootCACertificateFilePath',
    type: 'string',
  },
]);
