// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingStateEnumSchema, ReasonEnumSchema } from './enums.js';

export const TransactionTypeSchema = z.object({
  transactionId: z.string(),
  chargingState: ChargingStateEnumSchema.nullable().optional(),
  timeSpentCharging: z.number().int().nullable().optional(),
  stoppedReason: ReasonEnumSchema.nullable().optional(),
  remoteStartId: z.number().int().nullable().optional(),
});

export type TransactionType = z.infer<typeof TransactionTypeSchema>;
