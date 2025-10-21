// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingScheduleSchema } from './charging.schedule.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const ChargingProfileSchema = BaseSchema.extend({
  databaseId: z.number().int(),
  stationId: z.string(),
  id: z.number().int().optional(),
  chargingProfileKind: z.string(),
  chargingProfilePurpose: z.string(),
  recurrencyKind: z.string().nullable().optional(),
  stackLevel: z.number().int(),
  validFrom: z.iso.datetime().nullable().optional(),
  validTo: z.iso.datetime().nullable().optional(),
  evseId: z.number().int().nullable().optional(),
  isActive: z.boolean().default(false),
  chargingLimitSource: z.string().default('CSO').nullable().optional(),
  chargingSchedule: z.union([
    z.tuple([ChargingScheduleSchema]),
    z.tuple([ChargingScheduleSchema, ChargingScheduleSchema]),
    z.tuple([ChargingScheduleSchema, ChargingScheduleSchema, ChargingScheduleSchema]),
  ]),
  transactionDatabaseId: z.number().int().nullable().optional(),
});

export const ChargingProfileProps = ChargingProfileSchema.keyof().enum;

export type ChargingProfileDto = z.infer<typeof ChargingProfileSchema>;

export const ChargingProfileCreateSchema = ChargingProfileSchema.omit({
  databaseId: true,
  tenant: true,
  chargingSchedule: true,
  transaction: true,
  updatedAt: true,
  createdAt: true,
});

export type ChargingProfileCreate = z.infer<typeof ChargingProfileCreateSchema>;

export const chargingProfileSchemas = {
  ChargingProfile: ChargingProfileSchema,
  ChargingProfileCreate: ChargingProfileCreateSchema,
};
