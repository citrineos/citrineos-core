// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { EnergySourceCategory } from './EnergySourceCategory.js';

export const EnergySourcesSchema = z.object({
  source: z.nativeEnum(EnergySourceCategory),
  percentage: z.number().min(0).max(100),
});

export type EnergySources = z.infer<typeof EnergySourcesSchema>;
