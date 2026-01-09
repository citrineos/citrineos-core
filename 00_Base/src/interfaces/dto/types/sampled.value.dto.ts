// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { MeasurandEnumSchema } from './enums.js';

export const ReadingContextSchema = z.string();
export const PhaseSchema = z.string();
export const SampleLocationSchema = z.string();

export const UnitOfMeasureSchema = z.object({
  unit: z.string().optional(),
  multiplier: z.number().optional(),
});

export const SignedMeterValueSchema = z.object({
  signedMeterData: z.string(),
  signingMethod: z.string(),
  encodingMethod: z.string(),
  publicKey: z.string(),
});

export const SampledValueSchema = z.object({
  value: z.number(),
  context: ReadingContextSchema.optional(),
  measurand: MeasurandEnumSchema.optional(),
  phase: PhaseSchema.nullable().optional(),
  location: SampleLocationSchema.optional(),
  signedMeterValue: SignedMeterValueSchema.optional(),
  unitOfMeasure: UnitOfMeasureSchema.optional(),
});

export type SampledValue = z.infer<typeof SampledValueSchema>;
export type UnitOfMeasure = z.infer<typeof UnitOfMeasureSchema>;
export type SignedMeterValue = z.infer<typeof SignedMeterValueSchema>;
