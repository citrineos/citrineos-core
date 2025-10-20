// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const AdditionalInfoSchema = z.object({
  id: z.number().int().optional(),
  additionalIdToken: z.string(),
  type: z.string(),
});

export type AdditionalInfo = z.infer<typeof AdditionalInfoSchema>;
