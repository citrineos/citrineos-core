// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';
import { SampledValueSchema } from './types/sampled.value.dto.js';

export const MeterValueSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  transactionEventId: z.number().int().nullable().optional(),
  transactionDatabaseId: z.number().int().nullable().optional(),
  sampledValue: z.tuple([SampledValueSchema]).rest(SampledValueSchema),
  timestamp: z.iso.datetime(),
  connectorId: z.number().int().optional(),
  tariffId: z.number().int().nullable().optional(),
  transactionId: z.string().nullable().optional(),
});

export const MeterValueProps = MeterValueSchema.keyof().enum;

export type MeterValueDto = z.infer<typeof MeterValueSchema>;

export const MeterValueCreateSchema = MeterValueSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type MeterValueCreate = z.infer<typeof MeterValueCreateSchema>;

export const meterValueSchemas = {
  MeterValue: MeterValueSchema,
  MeterValueCreate: MeterValueCreateSchema,
};
