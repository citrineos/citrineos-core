// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { OcpiResponseSchema } from './OcpiResponse.js';

export enum ChargingProfileResultType {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  UNKNOWN = 'UNKNOWN',
}

export const ChargingProfileResultSchema = z.object({
  result: z.nativeEnum(ChargingProfileResultType),
});

export const ChargingProfileResultResponseSchema = OcpiResponseSchema(ChargingProfileResultSchema);

export type ChargingProfileResult = z.infer<typeof ChargingProfileResultSchema>;
export type ChargingProfileResultResponse = z.infer<typeof ChargingProfileResultResponseSchema>;
