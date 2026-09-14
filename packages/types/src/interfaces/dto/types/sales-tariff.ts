// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { CostKindEnumSchema } from './enums.js';

export const RelativeTimeIntervalSchema = z.object({
  start: z.number().int(),
  duration: z.number().int().nullable().optional(),
  customData: z.any().nullable().optional(),
});

export const CostSchema = z.object({
  costKind: CostKindEnumSchema,
  amount: z.number(),
  amountMultiplier: z.number().int().nullable().optional(),
  customData: z.any().nullable().optional(),
});

export const ConsumptionCostSchema = z.object({
  startValue: z.number(),
  cost: z.union([
    z.tuple([CostSchema]),
    z.tuple([CostSchema, CostSchema]),
    z.tuple([CostSchema, CostSchema, CostSchema]),
  ]),
  customData: z.any().nullable().optional(),
});

export const SalesTariffEntrySchema = z.object({
  relativeTimeInterval: RelativeTimeIntervalSchema,
  ePriceLevel: z.number().int().nullable().optional(),
  consumptionCost: z
    .union([
      z.tuple([ConsumptionCostSchema]),
      z.tuple([ConsumptionCostSchema, ConsumptionCostSchema]),
      z.tuple([ConsumptionCostSchema, ConsumptionCostSchema, ConsumptionCostSchema]),
    ])
    .nullable()
    .optional(),
  customData: z.any().nullable().optional(),
});

export type SalesTariffEntry = z.infer<typeof SalesTariffEntrySchema>;
export type RelativeTimeInterval = z.infer<typeof RelativeTimeIntervalSchema>;
export type Cost = z.infer<typeof CostSchema>;
export type ConsumptionCost = z.infer<typeof ConsumptionCostSchema>;
