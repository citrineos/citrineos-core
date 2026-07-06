// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { OcpiResponseSchema } from './OcpiResponse.js';

export enum ChargingPreferencesResponseType {
  ACCEPTED = 'ACCEPTED',
  DEPARTURE_REQUIRED = 'DEPARTURE_REQUIRED',
  ENERGY_NEED_REQUIRED = 'ENERGY_NEED_REQUIRED',
  NOT_POSSIBLE = 'NOT_POSSIBLE',
  PROFILE_TYPE_NOT_SUPPORTED = 'PROFILE_TYPE_NOT_SUPPORTED',
}

export const ChargingPreferencesResponseSchema = OcpiResponseSchema(
  z.nativeEnum(ChargingPreferencesResponseType),
);
export const ChargingPreferencesResponseSchemaName = 'ChargingPreferencesResponseSchema';

export type ChargingPreferencesResponse = z.infer<typeof ChargingPreferencesResponseSchema>;
