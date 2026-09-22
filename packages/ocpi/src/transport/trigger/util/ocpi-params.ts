// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const OcpiParamsSchema = z.object({
  fromCountryCode: z.string().length(2),
  fromPartyId: z.string().length(3),
  toCountryCode: z.string().length(2),
  toPartyId: z.string().length(3),
});

export type OcpiParams = z.infer<typeof OcpiParamsSchema>;
