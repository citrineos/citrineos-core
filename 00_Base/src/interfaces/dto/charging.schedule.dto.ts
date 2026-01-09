// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { SalesTariffSchema } from './sales.tariff.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const ChargingScheduleSchema = BaseSchema.extend({
  databaseId: z.number().int(),
  id: z.number().int().optional(),
  stationId: z.string(),
  chargingRateUnit: z.string(),
  chargingSchedulePeriod: z.tuple([z.any()]).rest(z.any()), // Non-empty array of JSONB
  duration: z.number().int().nullable().optional(),
  minChargingRate: z.number().nullable().optional(), // DECIMAL
  startSchedule: z.string().nullable().optional(),
  timeBase: z.iso.datetime().optional(),
  chargingProfileDatabaseId: z.number().int().optional(),
  salesTariff: SalesTariffSchema.optional(),
});

export const ChargingScheduleProps = ChargingScheduleSchema.keyof().enum;

export type ChargingScheduleDto = z.infer<typeof ChargingScheduleSchema>;

export const ChargingScheduleCreateSchema = ChargingScheduleSchema.omit({
  databaseId: true,
  tenant: true,
  chargingProfile: true,
  salesTariff: true,
  updatedAt: true,
  createdAt: true,
});

export type ChargingScheduleCreate = z.infer<typeof ChargingScheduleCreateSchema>;

export const chargingScheduleSchemas = {
  ChargingSchedule: ChargingScheduleSchema,
  ChargingScheduleCreate: ChargingScheduleCreateSchema,
};
