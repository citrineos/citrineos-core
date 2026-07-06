// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { TariffDimensionType } from './TariffDimensionType.js';

export const PriceComponentSchema = z.object({
  type: z.nativeEnum(TariffDimensionType),
  price: z.number(),
  vat: z.number().nullable().optional(),
  step_size: z.number().int(),
});

export type PriceComponent = z.infer<typeof PriceComponentSchema>;
