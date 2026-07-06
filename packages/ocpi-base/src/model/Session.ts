// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { AuthMethod } from './AuthMethod.js';
import { SessionStatus } from './SessionStatus.js';
import { PaginatedResponseSchema } from './PaginatedResponse.js';
import { OcpiResponseSchema } from './OcpiResponse.js';
import { PriceSchema } from './Price.js';
import { ChargingPeriodSchema } from './ChargingPeriod.js';
import { CdrTokenSchema } from './CdrToken.js';

export const SessionSchema = z.object({
  country_code: z.string().min(2).max(2),
  party_id: z.string().max(3),
  id: z.string().max(36),
  start_date_time: z.coerce.date(),
  end_date_time: z.coerce.date().nullable().optional(),
  kwh: z.number(),
  cdr_token: CdrTokenSchema,
  auth_method: z.nativeEnum(AuthMethod),
  authorization_reference: z.string().max(36).nullable().optional(),
  location_id: z.string().max(36),
  evse_uid: z.string().max(36),
  connector_id: z.string().max(36),
  meter_id: z.string().max(255).nullable().optional(),
  currency: z.string().min(3).max(3),
  charging_periods: z.array(ChargingPeriodSchema).optional().nullable(),
  total_cost: PriceSchema.optional().nullable(),
  status: z.nativeEnum(SessionStatus),
  last_updated: z.coerce.date(),
});

export type Session = z.infer<typeof SessionSchema>;

export const SessionResponseSchema = OcpiResponseSchema(SessionSchema);
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

export const PaginatedSessionResponseSchema = PaginatedResponseSchema(SessionSchema);
export const PaginatedSessionResponseSchemaName = 'PaginatedSessionResponseSchema';
export type PaginatedSessionResponse = z.infer<typeof PaginatedSessionResponseSchema>;
