// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingProfileSchema } from './ChargingProfile.js';

export const SetChargingProfileSchema = z.object({
  charging_profile: ChargingProfileSchema,
  response_url: z.string().url(),
});
export const SetChargingProfileSchemaName = 'SetChargingProfile';

export type SetChargingProfile = z.infer<typeof SetChargingProfileSchema>;
