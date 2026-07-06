// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { RegularHoursSchema } from './RegularHours.js';
import { ExceptionalPeriodSchema } from './ExceptionalPeriod.js';

export const HoursSchema = z.object({
  regular_hours: z.array(RegularHoursSchema).nullable().optional(),
  twentyfourseven: z.boolean(),
  exceptional_openings: z.array(ExceptionalPeriodSchema).nullable().optional(),
  exceptional_closings: z.array(ExceptionalPeriodSchema).nullable().optional(),
});

export type Hours = z.infer<typeof HoursSchema>;
