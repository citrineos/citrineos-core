// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { EnvironmentalImpactCategory } from './EnvironmentalImpactCategory.js';

export const EnvironmentalImpactSchema = z.object({
  category: z.nativeEnum(EnvironmentalImpactCategory),
  amount: z.number().min(0),
});

export type EnvironmentalImpact = z.infer<typeof EnvironmentalImpactSchema>;
