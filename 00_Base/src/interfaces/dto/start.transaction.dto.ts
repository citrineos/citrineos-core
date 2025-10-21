// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ConnectorSchema } from './connector.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const StartTransactionSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  meterStart: z.number().int(), // Wh
  timestamp: z.iso.datetime(),
  reservationId: z.number().int().nullable().optional(),
  transactionDatabaseId: z.number().int(),
  connectorDatabaseId: z.number().int(),
  connector: ConnectorSchema.optional(),
});

export const StartTransactionProps = StartTransactionSchema.keyof().enum;

export type StartTransactionDto = z.infer<typeof StartTransactionSchema>;

export const StartTransactionCreateSchema = StartTransactionSchema.omit({
  id: true,
  tenant: true,
  connector: true,
  updatedAt: true,
  createdAt: true,
});

export type StartTransactionCreate = z.infer<typeof StartTransactionCreateSchema>;

export const startTransactionSchemas = {
  StartTransaction: StartTransactionSchema,
  StartTransactionCreate: StartTransactionCreateSchema,
};
