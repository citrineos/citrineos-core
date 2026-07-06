// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import type { ActiveChargingProfile } from '../../../model/ActiveChargingProfile.js';
import { ActiveChargingProfileSchema } from '../../../model/ActiveChargingProfile.js';

export const PutChargingProfileParamsSchema = z.object({
  sessionId: z.string().min(1),
  activeChargingProfile: ActiveChargingProfileSchema,
  fromCountryCode: z.string().length(2),
  fromPartyId: z.string().length(3),
  toCountryCode: z.string().length(2),
  toPartyId: z.string().length(3),
});

export type PutChargingProfileParams = z.infer<typeof PutChargingProfileParamsSchema>;

export const buildPutChargingProfileParams = (
  sessionId: string,
  activeChargingProfile: ActiveChargingProfile,
  fromCountryCode: string,
  fromPartyId: string,
  toCountryCode: string,
  toPartyId: string,
): PutChargingProfileParams => ({
  sessionId,
  activeChargingProfile,
  fromCountryCode,
  fromPartyId,
  toCountryCode,
  toPartyId,
});
