// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const UnregisterClientRequestDTOSchema = z.object({
  serverPartyId: z.string().length(3),
  serverCountryCode: z.string().length(2),
  clientPartyId: z.string().length(3),
  clientCountryCode: z.string().length(2),
});

export type UnregisterClientRequestDTO = z.infer<typeof UnregisterClientRequestDTOSchema>;
export const UnregisterClientRequestDTOSchemaName = 'UnregisterClientRequestDTO';
