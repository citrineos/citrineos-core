// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingProfileResultType } from './charging-profile-result.js';
import { ActiveChargingProfileSchema } from './active-charging-profile.js';

export const ActiveChargingProfileResultSchema = z.object({
  result: z.nativeEnum(ChargingProfileResultType),
  profile: ActiveChargingProfileSchema.nullish(),
});

export type ActiveChargingProfileResult = z.infer<typeof ActiveChargingProfileResultSchema>;
