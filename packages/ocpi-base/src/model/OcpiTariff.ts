// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const OcpiTariffSchema = z.object({
  countryCode: z.string().length(2),
  partyId: z.string().length(3),
  coreTariffId: z.number(),
  tariffAltText: z.array(z.any()).nullable().optional(),
  updatedAt: z.date().optional(),
});

export type OcpiTariff = z.infer<typeof OcpiTariffSchema>;
