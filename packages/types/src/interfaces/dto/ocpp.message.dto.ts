// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';
import {
  MessageOriginSchema,
  MessageStateSchema,
  MessageTypeSchema,
  OCPPVersionSchema,
} from './types/ocpp.message.js';

export const OCPPMessageWithoutRequestResponseSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  ocppConnectionName: z.string(),
  stationId: z.number().int().optional(),
  correlationId: z.string().optional(),
  origin: MessageOriginSchema,
  type: MessageTypeSchema.optional(),
  /**
   * @deprecated Kept for backwards compatibility with consumers written against the
   * pre-`type` schema. Derived from `type` on every write: Call -> Request,
   * CallResult/CallError -> Response, unknown -> Unknown. Read `type` instead.
   */
  state: MessageStateSchema.optional(),
  protocol: OCPPVersionSchema,
  action: z.string().optional(),
  payload: z.any().optional(), // JSONB
  raw: z.string(),
  /**
   * @deprecated Kept for backwards compatibility with consumers written against the
   * pre-`payload`/`raw` schema. Holds the whole RPC frame — e.g.
   * `[2, "<id>", "BootNotification", {...}]` — of which `payload` is one element.
   * Read `payload` (parsed payload) or `raw` (exact wire text) instead.
   */
  message: z.any().optional(), // JSONB
  timestamp: z.iso.datetime(),
});

const OCPPMessageSchema = OCPPMessageWithoutRequestResponseSchema.extend({
  requestMessageId: z.number().int().optional(),
  requestMessage: OCPPMessageWithoutRequestResponseSchema.optional(),
  responseMessages: OCPPMessageWithoutRequestResponseSchema.array().optional(),
});

export const OCPPMessageProps = OCPPMessageSchema.keyof().enum;

export type OCPPMessageDto = z.infer<typeof OCPPMessageSchema>;

export const OCPPMessageCreateSchema = OCPPMessageSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type OCPPMessageCreate = z.infer<typeof OCPPMessageCreateSchema>;

export const ocppMessageSchemas = {
  OCPPMessage: OCPPMessageSchema,
  OCPPMessageCreate: OCPPMessageCreateSchema,
};
