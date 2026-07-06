// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const ChargingProfilePeriodSchema = z.object({
  start_period: z.number().int(),
  limit: z
    .number()
    .max(999999)
    .refine((val) => Number.isFinite(val), {
      message: 'limit must be a number with at most 1 decimal place',
    }),
});

export type ChargingProfilePeriod = z.infer<typeof ChargingProfilePeriodSchema>;
