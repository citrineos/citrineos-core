// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const SubscriptionSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  onConnect: z.boolean().default(false),
  onClose: z.boolean().default(false),
  onMessage: z.boolean().default(false),
  sentMessage: z.boolean().default(false),
  messageRegexFilter: z.string().nullable().optional(),
  url: z.string(),
});

export const SubscriptionProps = SubscriptionSchema.keyof().enum;

export type SubscriptionDto = z.infer<typeof SubscriptionSchema>;

export const SubscriptionCreateSchema = SubscriptionSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type SubscriptionCreate = z.infer<typeof SubscriptionCreateSchema>;

export const subscriptionSchemas = {
  Subscription: SubscriptionSchema,
  SubscriptionCreate: SubscriptionCreateSchema,
};
