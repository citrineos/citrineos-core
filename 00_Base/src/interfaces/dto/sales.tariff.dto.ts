// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';
import { SalesTariffEntrySchema } from './types/sales.tariff.js';

export const SalesTariffSchema = BaseSchema.extend({
  databaseId: z.number().int(),
  id: z.number().int().optional(),
  numEPriceLevels: z.number().int().nullable().optional(),
  salesTariffDescription: z.string().nullable().optional(),
  salesTariffEntry: z.tuple([SalesTariffEntrySchema]).rest(SalesTariffEntrySchema), // Non-empty array
  chargingScheduleDatabaseId: z.number().int(),
});

export const SalesTariffProps = SalesTariffSchema.keyof().enum;

export type SalesTariffDto = z.infer<typeof SalesTariffSchema>;

export const SalesTariffCreateSchema = SalesTariffSchema.omit({
  databaseId: true,
  tenant: true,
  chargingSchedule: true,
  updatedAt: true,
  createdAt: true,
});

export type SalesTariffCreate = z.infer<typeof SalesTariffCreateSchema>;

export const salesTariffSchemas = {
  SalesTariff: SalesTariffSchema,
  SalesTariffCreate: SalesTariffCreateSchema,
};
