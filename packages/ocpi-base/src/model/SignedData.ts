// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { SignedValueSchema } from './SignedValue.js';

export const SignedDataSchema = z.object({
  encoding_method: z.string().max(36),
  encoding_method_version: z.number().int().nullable().optional(),
  public_key: z.string().max(512).nullable().optional(),
  signed_values: z.array(SignedValueSchema).min(1),
  url: z.string().max(512).url().nullable().optional(),
});

export type SignedData = z.infer<typeof SignedDataSchema>;
