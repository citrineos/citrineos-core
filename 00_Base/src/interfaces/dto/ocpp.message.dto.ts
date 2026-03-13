// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';
import {
  MessageOriginSchema,
  MessageStateSchema,
  OCPPVersionSchema,
} from './types/ocpp.message.js';

export const OCPPMessageWithoutRequestResponseSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  correlationId: z.string().optional(),
  origin: MessageOriginSchema,
  state: MessageStateSchema,
  protocol: OCPPVersionSchema,
  action: z.string(),
  message: z.any(), // JSONB
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
