// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const ExceptionalPeriodSchema = z.object({
  period_begin: z.coerce.date(),
  period_end: z.coerce.date(),
});

export type ExceptionalPeriod = z.infer<typeof ExceptionalPeriodSchema>;
