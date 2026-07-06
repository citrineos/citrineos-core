// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { PriceComponentSchema } from './PriceComponent.js';
import { TariffRestrictionsSchema } from './TariffRestrictions.js';

export const TariffElementSchema = z.object({
  price_components: z.array(PriceComponentSchema).min(1),
  restrictions: TariffRestrictionsSchema.nullable().optional(),
});

export type TariffElement = z.infer<typeof TariffElementSchema>;
