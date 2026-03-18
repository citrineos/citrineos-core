// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const TariffSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  connectorId: z.number().int().nullable().optional(),
  currency: z.string().length(3), // CHAR(3)
  pricePerKwh: z.number().min(0), // DECIMAL
  pricePerMin: z.number().min(0).nullable().optional(), // DECIMAL
  pricePerSession: z.number().min(0).nullable().optional(), // DECIMAL
  authorizationAmount: z.number().min(0).nullable().optional(), // DECIMAL
  paymentFee: z.number().min(0).nullable().optional(), // DECIMAL
  taxRate: z.number().min(0).nullable().optional(), // DECIMAL
  tariffAltText: z.record(z.string(), z.any()).nullable().optional(), // JSONB
});

export const TariffProps = TariffSchema.keyof().enum;

export type TariffDto = z.infer<typeof TariffSchema>;

export const TariffCreateSchema = TariffSchema.omit({
  id: true,
  tenant: true,
  connector: true,
  updatedAt: true,
  createdAt: true,
});

export type TariffCreate = z.infer<typeof TariffCreateSchema>;

export const tariffSchemas = {
  Tariff: TariffSchema,
  TariffCreate: TariffCreateSchema,
};
