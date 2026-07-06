// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { TokenType } from './TokenType.js';

export const CdrTokenSchema = z.object({
  uid: z.string().max(36),
  type: z.nativeEnum(TokenType).nullable().optional(),
  contract_id: z.string().max(36),
  country_code: z.string().max(2),
  party_id: z.string().max(3),
});

export type CdrToken = z.infer<typeof CdrTokenSchema>;
