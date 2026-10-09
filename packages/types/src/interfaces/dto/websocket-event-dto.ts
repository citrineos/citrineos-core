// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base-dto.js';
import { MessageOriginSchema } from './types/ocpp-message.js';
import { WebsocketEventTypeSchema } from './types/websocket-event.js';

export const WebsocketEventSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.number().int().nullable().optional(),
  serverId: z.string(),
  host: z.string(),
  remoteAddress: z.string().nullable().optional(),
  uri: z.string().nullable().optional(),
  type: WebsocketEventTypeSchema,
  timestamp: z.iso.datetime(),
  subprotocol: z.string().nullable().optional(),
  httpStatus: z.number().int().nullable().optional(),
  wsCloseCode: z.number().int().nullable().optional(),
  sentCode: z.number().int().nullable().optional(),
  closeReason: z.string().nullable().optional(),
  // Absent on an abnormal close (1006), where neither side sent a close frame.
  initiator: MessageOriginSchema.nullable().optional(),
  source: z.string().nullable().optional(),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const WebsocketEventProps = WebsocketEventSchema.keyof().enum;

export type WebsocketEventDto = z.infer<typeof WebsocketEventSchema>;

export const WebsocketEventCreateSchema = WebsocketEventSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type WebsocketEventCreate = z.infer<typeof WebsocketEventCreateSchema>;

export const websocketEventSchemas = {
  WebsocketEvent: WebsocketEventSchema,
  WebsocketEventCreate: WebsocketEventCreateSchema,
};
