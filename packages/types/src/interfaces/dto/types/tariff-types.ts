// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { MessageFormatEnumSchema } from './enums.js';

const customData = z.any().nullable().optional();

export const TaxRateSchema = z.object({
  type: z.string(),
  tax: z.number(),
  stack: z.number().int().nullable().optional(),
  customData,
});

const taxRates = TaxRateSchema.array().min(1).max(5).nullable().optional();

export const TariffConditionsSchema = z.object({
  startTimeOfDay: z.string().nullable().optional(),
  endTimeOfDay: z.string().nullable().optional(),
  dayOfWeek: z.string().array().min(1).max(7).nullable().optional(),
  validFromDate: z.string().nullable().optional(),
  validToDate: z.string().nullable().optional(),
  evseKind: z.string().nullable().optional(),
  minEnergy: z.number().nullable().optional(),
  maxEnergy: z.number().nullable().optional(),
  minCurrent: z.number().nullable().optional(),
  maxCurrent: z.number().nullable().optional(),
  minPower: z.number().nullable().optional(),
  maxPower: z.number().nullable().optional(),
  minTime: z.number().nullable().optional(),
  maxTime: z.number().nullable().optional(),
  minChargingTime: z.number().nullable().optional(),
  maxChargingTime: z.number().nullable().optional(),
  minIdleTime: z.number().nullable().optional(),
  maxIdleTime: z.number().nullable().optional(),
  customData,
});

export const TariffConditionsFixedSchema = z.object({
  startTimeOfDay: z.string().nullable().optional(),
  endTimeOfDay: z.string().nullable().optional(),
  dayOfWeek: z.string().array().min(1).max(7).nullable().optional(),
  validFromDate: z.string().nullable().optional(),
  validToDate: z.string().nullable().optional(),
  evseKind: z.string().nullable().optional(),
  paymentBrand: z.string().nullable().optional(),
  paymentRecognition: z.string().nullable().optional(),
  customData,
});

export const TariffMessageContentSchema = z.object({
  format: MessageFormatEnumSchema,
  language: z.string().nullable().optional(),
  content: z.string(),
  customData,
});

export const TariffEnergyPriceSchema = z.object({
  priceKwh: z.number(),
  conditions: TariffConditionsSchema.nullable().optional(),
  customData,
});

export const TariffEnergySchema = z.object({
  prices: TariffEnergyPriceSchema.array().min(1),
  taxRates,
  customData,
});

export const TariffTimePriceSchema = z.object({
  priceMinute: z.number(),
  conditions: TariffConditionsSchema.nullable().optional(),
  customData,
});

export const TariffTimeSchema = z.object({
  prices: TariffTimePriceSchema.array().min(1),
  taxRates,
  customData,
});

export const TariffFixedPriceSchema = z.object({
  priceFixed: z.number(),
  conditions: TariffConditionsFixedSchema.nullable().optional(),
  customData,
});

export const TariffFixedSchema = z.object({
  prices: TariffFixedPriceSchema.array().min(1),
  taxRates,
  customData,
});

export const PriceSchema = z.object({
  exclTax: z.number().nullable().optional(),
  inclTax: z.number().nullable().optional(),
  taxRates,
  customData,
});

export type TaxRateType = z.infer<typeof TaxRateSchema>;
export type TariffConditionsType = z.infer<typeof TariffConditionsSchema>;
export type TariffConditionsFixedType = z.infer<typeof TariffConditionsFixedSchema>;
export type MessageContentType = z.infer<typeof TariffMessageContentSchema>;
export type TariffEnergyType = z.infer<typeof TariffEnergySchema>;
export type TariffTimeType = z.infer<typeof TariffTimeSchema>;
export type TariffFixedType = z.infer<typeof TariffFixedSchema>;
export type PriceType = z.infer<typeof PriceSchema>;
