// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { CdrDimensionType } from './CdrDimensionType.js';

export const CdrDimensionSchema = z.object({
  type: z.nativeEnum(CdrDimensionType),
  volume: z.number(),
});

export type CdrDimension = z.infer<typeof CdrDimensionSchema>;
