// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { AuthorizationStatusEnumSchema } from './enums.js';

export const AdditionalInfoSchema = z.object({
  id: z.number().int().optional(),
  additionalIdToken: z.string(),
  type: z.string(),
});

export type AdditionalInfo = z.infer<typeof AdditionalInfoSchema>;

export const RealTimeAuthLastAttemptSchema = z.object({
  timestamp: z.iso.datetime().nullable().optional(),
  result: AuthorizationStatusEnumSchema.nullable().optional(),
  stationId: z.string().nullable().optional(),
  evseId: z.string().nullable().optional(),
  connectorId: z.string().nullable().optional(),
});

export type RealTimeAuthLastAttempt = z.infer<typeof RealTimeAuthLastAttemptSchema>;
