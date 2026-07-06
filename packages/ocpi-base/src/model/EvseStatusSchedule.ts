// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { EvseStatus } from './EvseStatus.js';

export const EvseStatusScheduleSchema = z.object({
  period_begin: z.coerce.date(),
  period_end: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(EvseStatus),
});

export type EvseStatusSchedule = z.infer<typeof EvseStatusScheduleSchema>;
