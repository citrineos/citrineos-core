// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const CompositeScheduleSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  evseId: z.number().int(),
  duration: z.number().int(),
  scheduleStart: z.iso.datetime(),
  chargingRateUnit: z.string(),
  chargingSchedulePeriod: z.tuple([z.any()]).rest(z.any()),
});

export const CompositeScheduleProps = CompositeScheduleSchema.keyof().enum;

export type CompositeScheduleDto = z.infer<typeof CompositeScheduleSchema>;

export const CompositeScheduleCreateSchema = CompositeScheduleSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type CompositeScheduleCreate = z.infer<typeof CompositeScheduleCreateSchema>;

export const compositeScheduleSchemas = {
  CompositeSchedule: CompositeScheduleSchema,
  CompositeScheduleCreate: CompositeScheduleCreateSchema,
};
