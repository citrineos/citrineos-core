// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { EvseTypeSchema } from './evse.type.dto.js';
import { MeterValueSchema } from './meter.value.dto.js';
import { BaseSchema } from './types/base.dto.js';
import { TransactionEventEnumSchema, TriggerReasonEnumSchema } from './types/enums.js';

export const TransactionEventSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  eventType: TransactionEventEnumSchema,
  meterValue: z.tuple([MeterValueSchema]).rest(MeterValueSchema).optional(), // Non-empty array
  timestamp: z.iso.datetime(),
  triggerReason: TriggerReasonEnumSchema,
  seqNo: z.number().int(),
  offline: z.boolean().default(false).nullable().optional(),
  numberOfPhasesUsed: z.number().int().nullable().optional(),
  cableMaxCurrent: z.number().nullable().optional(), // DECIMAL
  reservationId: z.number().int().nullable().optional(),
  transactionDatabaseId: z.number().int().optional(),
  evseId: z.number().int().nullable().optional(),
  evse: EvseTypeSchema.omit({ tenantId: true }).optional(), // TenantId omitted so that raw OCPP data can be stored
  idTokenValue: z.string().nullable().optional(),
  idTokenType: z.string().nullable().optional(),
});

export const TransactionEventProps = TransactionEventSchema.keyof().enum;

export type TransactionEventDto = z.infer<typeof TransactionEventSchema>;

export const TransactionEventCreateSchema = TransactionEventSchema.omit({
  id: true,
  tenant: true,
  meterValue: true,
  transaction: true,
  evse: true,
  updatedAt: true,
  createdAt: true,
});

export type TransactionEventCreate = z.infer<typeof TransactionEventCreateSchema>;

export const transactionEventSchemas = {
  TransactionEvent: TransactionEventSchema,
  TransactionEventCreate: TransactionEventCreateSchema,
};
