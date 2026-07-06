// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingProfileSchema } from './ChargingProfile.js';

export const ActiveChargingProfileSchema = z.object({
  start_date_time: z.coerce.date(),
  charging_profile: ChargingProfileSchema,
});

export type ActiveChargingProfile = z.infer<typeof ActiveChargingProfileSchema>;
