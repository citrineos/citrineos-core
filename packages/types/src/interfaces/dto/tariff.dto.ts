// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const TariffSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  currency: z.string().length(3), // CHAR(3)
  pricePerKwh: z.number().min(0), // DECIMAL
  pricePerMin: z.number().min(0).nullable().optional(), // DECIMAL
  pricePerSession: z.number().min(0).nullable().optional(), // DECIMAL
  authorizationAmount: z.number().min(0).nullable().optional(), // DECIMAL
  paymentFee: z.number().min(0).nullable().optional(), // DECIMAL
  taxRate: z.number().min(0).nullable().optional(), // DECIMAL
  tariffAltText: z.record(z.string(), z.any()).nullable().optional(), // JSONB
  // OCPP 2.1 TariffType fields
  tariffId: z.string().nullable().optional(),
  validFrom: z.string().datetime().nullable().optional(),
  description: z.array(z.any()).nullable().optional(), // MessageContentType[]
  energy: z.any().nullable().optional(), // TariffEnergyType
  chargingTime: z.any().nullable().optional(), // TariffTimeType
  idleTime: z.any().nullable().optional(), // TariffTimeType
  fixedFee: z.any().nullable().optional(), // TariffFixedType
  reservationTime: z.any().nullable().optional(), // TariffTimeType
  reservationFixed: z.any().nullable().optional(), // TariffFixedType
  minCost: z.any().nullable().optional(), // PriceType
  maxCost: z.any().nullable().optional(), // PriceType
});

export const TariffProps = TariffSchema.keyof().enum;

export type TariffDto = z.infer<typeof TariffSchema>;

export const TariffCreateSchema = TariffSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type TariffCreate = z.infer<typeof TariffCreateSchema>;

export const tariffSchemas = {
  Tariff: TariffSchema,
  TariffCreate: TariffCreateSchema,
};
