// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ComponentSchema } from './component.dto.js';
import { BaseSchema } from './types/base.dto.js';

const MessagePrioritySchema = z.string();
const MessageStateSchema = z.string();
const MessageContentSchema = z.any();

export const MessageInfoSchema = BaseSchema.extend({
  databaseId: z.number().int(),
  stationId: z.string(),
  id: z.number().int().optional(),
  priority: MessagePrioritySchema,
  state: MessageStateSchema.nullable().optional(),
  startDateTime: z.iso.datetime().nullable().optional(),
  endDateTime: z.iso.datetime().nullable().optional(),
  transactionId: z.string().nullable().optional(),
  message: MessageContentSchema,
  active: z.boolean(),
  display: ComponentSchema,
  displayComponentId: z.number().int().nullable().optional(),
});

export const MessageInfoProps = MessageInfoSchema.keyof().enum;

export type MessageInfoDto = z.infer<typeof MessageInfoSchema>;

export const MessageInfoCreateSchema = MessageInfoSchema.omit({
  databaseId: true,
  tenant: true,
  display: true,
  updatedAt: true,
  createdAt: true,
});

export type MessageInfoCreate = z.infer<typeof MessageInfoCreateSchema>;

export const messageInfoSchemas = {
  MessageInfo: MessageInfoSchema,
  MessageInfoCreate: MessageInfoCreateSchema,
};
