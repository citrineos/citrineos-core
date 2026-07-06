// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ProfileType } from './ProfileType.js';

export const ChargingPreferencesSchema = z.object({
  profile_type: z.nativeEnum(ProfileType),
  departure_time: z.coerce.date().optional(),
  energy_need: z.number().optional(),
  discharge_allowed: z.boolean().optional(),
});
export const ChargingPreferencesSchemaName = 'ChargingPreferences';

export type ChargingPreferences = z.infer<typeof ChargingPreferencesSchema>;
