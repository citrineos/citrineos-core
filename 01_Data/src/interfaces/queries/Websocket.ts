// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

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
  {
    key: 'tenantId',
    type: 'number',
    required: true,
  },
  {
    key: 'tenantPathMapping',
    type: 'object',
  },
  {
    key: 'dynamicTenantResolution',
    type: 'boolean',
  },
]);

export interface WebsocketMappingQuerystring {
  id: string;
  path?: string;
  tenantId?: number;
}

export const WebsocketMappingQuerySchema = QuerySchema('WebsocketMappingQuerySchema', [
  {
    key: 'id',
    type: 'string',
    required: true,
  },
  {
    key: 'path',
    type: 'string',
  },
  {
    key: 'tenantId',
    type: 'number',
  },
]);

export const WebsocketMappingRequestSchema = QuerySchema('WebsocketMappingRequestSchema', [
  {
    key: 'path',
    type: 'string',
    required: true,
  },
  {
    key: 'tenantId',
    type: 'number',
    required: true,
  },
]);
