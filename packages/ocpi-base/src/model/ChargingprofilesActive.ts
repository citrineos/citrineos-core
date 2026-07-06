// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ActiveChargingProfileSchema } from './ActiveChargingProfile.js';

export const ChargingprofilesActiveSchema = z.object({
  start_date_time: z.coerce.date(),
  charging_profile: ActiveChargingProfileSchema,
});

export type ChargingprofilesActive = z.infer<typeof ChargingprofilesActiveSchema>;
