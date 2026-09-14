// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import {
  LocationEnumSchema,
  MeasurandEnumSchema,
  PhaseEnumSchema,
  ReadingContextEnumSchema,
} from './enums.js';

export const UnitOfMeasureSchema = z.object({
  unit: z.string().nullable().optional(),
  multiplier: z.number().nullable().optional(),
});

export const SignedMeterValueSchema = z.object({
  signedMeterData: z.string(),
  signingMethod: z.string(),
  encodingMethod: z.string(),
  publicKey: z.string(),
});

export const SampledValueSchema = z.object({
  value: z.number(),
  context: ReadingContextEnumSchema.nullable().optional(),
  measurand: MeasurandEnumSchema.nullable().optional(),
  phase: PhaseEnumSchema.nullable().optional(),
  location: LocationEnumSchema.nullable().optional(),
  signedMeterValue: SignedMeterValueSchema.nullable().optional(),
  unitOfMeasure: UnitOfMeasureSchema.nullable().optional(),
});

export type SampledValue = z.infer<typeof SampledValueSchema>;
export type UnitOfMeasure = z.infer<typeof UnitOfMeasureSchema>;
export type SignedMeterValue = z.infer<typeof SignedMeterValueSchema>;
