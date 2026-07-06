// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { EnergySourcesSchema } from './EnergySources.js';
import { EnvironmentalImpactSchema } from './EnvironmentalImpact.js';

export const EnergyMixSchema = z.object({
  is_green_energy: z.boolean(),
  energy_sources: z.array(EnergySourcesSchema).optional().nullable(),
  environ_impact: z.array(EnvironmentalImpactSchema).optional().nullable(),
  supplier_name: z.string().max(64).optional().nullable(),
  energy_product_name: z.string().max(64).optional().nullable(),
});

export type EnergyMix = z.infer<typeof EnergyMixSchema>;
