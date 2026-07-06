// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingProfilePeriodSchema } from './ChargingProfilePeriod.js';

export const ChargingProfileSchema = z.object({
  start_date_time: z.coerce.date().nullable().optional(),
  duration: z.number().int().nullable().optional(),
  charging_rate_unit: z.string(),
  min_charging_rate: z.number().nullable().optional(),
  charging_profile_period: z.array(ChargingProfilePeriodSchema).nullable().optional(),
});

export type ChargingProfile = z.infer<typeof ChargingProfileSchema>;
