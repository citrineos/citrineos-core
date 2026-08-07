// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';

export const AddressSchema = z.object({
  name: z.string(),
  address1: z.string(),
  address2: z.string().nullable().optional(),
  city: z.string(),
  postalCode: z.string().nullable().optional(),
  country: z.string(),
  customData: z.any().nullable().optional(),
});

export type AddressType = z.infer<typeof AddressSchema>;
