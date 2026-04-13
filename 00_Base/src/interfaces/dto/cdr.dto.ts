// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import {
  AuthMethodSchema,
  CdrDimensionTypeSchema,
  TariffDimensionTypeSchema, // check this exists, else inline
} from './types/enums.js';

const PriceSchema = z.object({
  excl_vat: z.number(),
  incl_vat: z.number().nullable().optional(),
});

const CdrTokenSchema = z.object({
  country_code: z.string().length(2),
  party_id: z.string().max(3),
  uid: z.string().max(36),
  type: z.string(), // TokenType — inline if not in enums yet
  contract_id: z.string().max(36),
});

const CdrLocationSchema = z.object({
  id: z.string().max(36),
  name: z.string().max(255).nullable().optional(),
  address: z.string().max(45),
  city: z.string().max(45),
  postal_code: z.string().max(10).nullable().optional(),
  state: z.string().max(20).nullable().optional(),
  country: z.string().length(3),
  coordinates: z.object({
    latitude: z.string(),
    longitude: z.string(),
  }),
  evse_uid: z.string().max(36),
  evse_id: z.string().max(48),
  connector_id: z.string().max(36),
  connector_standard: z.string(),
  connector_format: z.string(),
  connector_power_type: z.string(),
});

const ChargingPeriodSchema = z.object({
  start_date_time: z.coerce.date(),
  dimensions: z.array(
    z.object({
      type: CdrDimensionTypeSchema,
      volume: z.number(),
    }),
  ),
  tariff_id: z.string().max(36).nullable().optional(),
});

const TariffElementSchema = z.object({
  price_components: z.array(
    z.object({
      type: TariffDimensionTypeSchema,
      price: z.number(),
      vat: z.number().nullable().optional(),
      step_size: z.number().int(),
    }),
  ),
});

const CdrTariffSchema = z.object({
  country_code: z.string().length(2),
  party_id: z.string().max(3),
  id: z.string().max(36),
  currency: z.string().length(3),
  elements: z.array(TariffElementSchema),
  last_updated: z.coerce.date(),
});

export const CdrDtoSchema = z.object({
  country_code: z.string().length(2),
  party_id: z.string().max(3),
  id: z.string().max(39),
  start_date_time: z.coerce.date(),
  end_date_time: z.coerce.date(),
  session_id: z.string().max(36).nullable().optional(),
  cdr_token: CdrTokenSchema,
  auth_method: AuthMethodSchema,
  authorization_reference: z.string().max(36).nullable().optional(),
  cdr_location: CdrLocationSchema,
  meter_id: z.string().max(255).nullable().optional(),
  currency: z.string().length(3),
  tariffs: z.array(CdrTariffSchema).nullable().optional(),
  charging_periods: z.array(ChargingPeriodSchema).min(1),
  signed_data: z.unknown().nullable().optional(),
  total_cost: PriceSchema,
  total_fixed_cost: PriceSchema.nullable().optional(),
  total_energy: z.number(),
  total_energy_cost: PriceSchema.nullable().optional(),
  total_time: z.number(),
  total_time_cost: PriceSchema.nullable().optional(),
  total_parking_time: z.number().nullable().optional(),
  total_parking_cost: PriceSchema.nullable().optional(),
  total_reservation_cost: PriceSchema.nullable().optional(),
  remark: z.string().max(255).nullable().optional(),
  invoice_reference_id: z.string().max(39).nullable().optional(),
  credit: z.boolean().nullable().optional(),
  credit_reference_id: z.string().max(39).nullable().optional(),
  home_charging_compensation: z.boolean().nullable().optional(),
  last_updated: z.coerce.date(),
});

export const CdrDtoSchemaName = 'CdrDtoSchema';

export type CdrDto = z.infer<typeof CdrDtoSchema>;
