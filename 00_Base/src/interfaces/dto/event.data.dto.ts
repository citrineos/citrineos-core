// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ComponentSchema } from './component.dto.js';
import { BaseSchema } from './types/base.dto.js';
import { VariableSchema } from './variable.dto.js';
import { EventNotificationEnumSchema, EventTriggerEnumSchema } from './types/enums.js';

export const EventDataSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  eventId: z.number().int(),
  trigger: EventTriggerEnumSchema,
  cause: z.number().int().nullable().optional(),
  timestamp: z.iso.datetime(),
  actualValue: z.string(),
  techCode: z.string().nullable().optional(),
  techInfo: z.string().nullable().optional(),
  cleared: z.boolean().nullable().optional(),
  transactionId: z.string().nullable().optional(),
  variableMonitoringId: z.number().int().nullable().optional(),
  eventNotificationType: EventNotificationEnumSchema,
  variable: VariableSchema,
  variableId: z.number().int().optional(),
  component: ComponentSchema,
  componentId: z.number().int().optional(),
});

export const EventDataProps = EventDataSchema.keyof().enum;

export type EventDataDto = z.infer<typeof EventDataSchema>;

export const EventDataCreateSchema = EventDataSchema.omit({
  id: true,
  tenant: true,
  variable: true,
  component: true,
  updatedAt: true,
  createdAt: true,
});

export type EventDataCreate = z.infer<typeof EventDataCreateSchema>;

export const eventDataSchemas = {
  EventData: EventDataSchema,
  EventDataCreate: EventDataCreateSchema,
};
