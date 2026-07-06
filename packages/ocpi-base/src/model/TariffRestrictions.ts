// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { DayOfWeek } from './DayOfWeek.js';
import { ReservationRestrictionType } from './ReservationRestrictionType.js';

export const TariffRestrictionsSchema = z.object({
  start_time: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .length(5)
    .nullable()
    .optional(),
  end_time: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .length(5)
    .nullable()
    .optional(),
  start_date: z
    .string()
    .regex(/^([12][0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/)
    .length(10)
    .nullable()
    .optional(),
  end_date: z
    .string()
    .regex(/^([12][0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/)
    .length(10)
    .nullable()
    .optional(),
  min_kwh: z.number().nullable().optional(),
  max_kwh: z.number().nullable().optional(),
  min_current: z.number().nullable().optional(),
  max_current: z.number().nullable().optional(),
  min_power: z.number().nullable().optional(),
  max_power: z.number().nullable().optional(),
  min_duration: z.number().int().nullable().optional(),
  max_duration: z.number().int().nullable().optional(),
  day_of_week: z.array(z.nativeEnum(DayOfWeek)).nullable().optional(),
  reservation: z.nativeEnum(ReservationRestrictionType).nullable().optional(),
});

export type TariffRestrictions = z.infer<typeof TariffRestrictionsSchema>;
