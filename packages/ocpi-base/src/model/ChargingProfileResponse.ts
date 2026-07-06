// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { OcpiResponseSchema } from './OcpiResponse.js';

export enum ChargingProfileResultType {
  ACCEPTED = 'ACCEPTED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  REJECTED = 'REJECTED',
  TOO_OFTEN = 'TOO_OFTEN',
  UNKNOWN_SESSION = 'UNKNOWN_SESSION',
}

export const ChargingProfileSchema = z.object({
  result: z.nativeEnum(ChargingProfileResultType),
  timeout: z.number().int().min(0),
});

export type ChargingProfile = z.infer<typeof ChargingProfileSchema>;

export const ChargingProfileResponseSchema = OcpiResponseSchema(ChargingProfileSchema);
export const ChargingProfileResponseSchemaName = 'ChargingProfileResponse';

export type ChargingProfileResponse = z.infer<typeof ChargingProfileResponseSchema>;
