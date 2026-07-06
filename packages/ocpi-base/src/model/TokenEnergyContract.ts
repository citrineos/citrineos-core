// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const TokenEnergyContractSchema = z.object({
  supplier_name: z.string().max(64),
  contract_id: z.string().max(64).nullable().optional(),
});

export type TokenEnergyContract = z.infer<typeof TokenEnergyContractSchema>;
