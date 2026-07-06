// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { GeoLocationSchema } from './GeoLocation.js';

export const CdrLocationSchema = z.object({
  id: z.string().max(36),
  name: z.string().max(255).nullable().optional(),
  address: z.string().max(45),
  city: z.string().max(45),
  postal_code: z.string().max(10).nullable().optional(),
  state: z.string().max(20).nullable().optional(),
  country: z.string().min(3).max(3),
  coordinates: GeoLocationSchema,
  evse_uid: z.string().max(36),
  evse_id: z.string().max(48),
  connector_id: z.string().max(36),
  connector_standard: z.string(),
  connector_format: z.string(),
  connector_power_type: z.string(),
});

export type CdrLocation = z.infer<typeof CdrLocationSchema>;
