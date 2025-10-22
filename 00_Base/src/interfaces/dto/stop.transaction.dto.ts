// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { MeterValueSchema } from './meter.value.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const StopTransactionSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  transactionDatabaseId: z.number(),
  meterStop: z.number().int(),
  timestamp: z.iso.datetime(),
  reason: z.string().optional(),
  meterValues: z.array(MeterValueSchema).optional(),
  idTokenValue: z.string().optional(),
  idTokenType: z.string().optional(),
});

export const StopTransactionProps = StopTransactionSchema.keyof().enum;

export type StopTransactionDto = z.infer<typeof StopTransactionSchema>;

export const StopTransactionCreateSchema = StopTransactionSchema.omit({
  id: true,
  tenant: true,
  transaction: true,
  meterValues: true,
  updatedAt: true,
  createdAt: true,
});

export type StopTransactionCreate = z.infer<typeof StopTransactionCreateSchema>;

export const stopTransactionSchemas = {
  StopTransaction: StopTransactionSchema,
  StopTransactionCreate: StopTransactionCreateSchema,
};
