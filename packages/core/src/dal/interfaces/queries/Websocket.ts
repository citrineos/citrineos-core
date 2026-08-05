// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QuerySchema } from '@citrineos/base';
import { websocketServerSchema } from '@citrineos/types';
import { z } from 'zod';

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

export const WebsocketRequestSchema = {
  ...z.toJSONSchema(websocketServerSchema, { target: 'openapi-3.0', io: 'input' }),
  $id: 'WebsocketRequestSchema',
};

export interface WebsocketMappingQuerystring {
  id: string;
  path: string;
  tenantId: number;
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
    required: true,
  },
  {
    key: 'tenantId',
    type: 'number',
    required: true,
  },
]);
