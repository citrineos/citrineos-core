// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const OcpiLocationSchema = z.object({
  coreLocationId: z.number().int(),
  publish: z.boolean(),
  lastUpdated: z.coerce.date(),
  partyId: z.string().length(3),
  countryCode: z.string().length(2),
  timeZone: z.string(),
});

export type OcpiLocation = z.infer<typeof OcpiLocationSchema>;
