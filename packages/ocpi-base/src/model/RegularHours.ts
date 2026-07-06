// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const RegularHoursSchema = z.object({
  weekday: z.number().int().min(1).max(7),
  period_begin: z
    .string()
    .length(5)
    .regex(/([0-1][0-9]|2[0-3]):[0-5][0-9]/),
  period_end: z
    .string()
    .length(5)
    .regex(/([0-1][0-9]|2[0-3]):[0-5][0-9]/),
});

export type RegularHours = z.infer<typeof RegularHoursSchema>;
