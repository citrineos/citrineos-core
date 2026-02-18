// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const SecurityEventSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  type: z.string(),
  timestamp: z.iso.datetime(),
  techInfo: z.string().nullable().optional(),
});

export const SecurityEventProps = SecurityEventSchema.keyof().enum;

export type SecurityEventDto = z.infer<typeof SecurityEventSchema>;

export const SecurityEventCreateSchema = SecurityEventSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type SecurityEventCreate = z.infer<typeof SecurityEventCreateSchema>;

export const securityEventSchemas = {
  SecurityEvent: SecurityEventSchema,
  SecurityEventCreate: SecurityEventCreateSchema,
};
