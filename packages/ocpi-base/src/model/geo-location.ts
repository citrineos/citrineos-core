// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const GeoLocationSchema = z.object({
  latitude: z
    .string()
    .max(10)
    .regex(/-?[0-9]{1,2}\.[0-9]{5,7}/),
  longitude: z
    .string()
    .max(11)
    .regex(/-?[0-9]{1,3}\.[0-9]{5,7}/),
});

export type GeoLocation = z.infer<typeof GeoLocationSchema>;
