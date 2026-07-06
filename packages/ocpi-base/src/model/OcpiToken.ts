// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { TokenType } from './TokenType.js';
import { WhitelistType } from './WhitelistType.js';

export const OcpiTokenSchema = z.object({
  authorization_id: z.number(),
  country_code: z.string().length(2),
  party_id: z.string().length(3),
  type: z.nativeEnum(TokenType),
  visual_number: z.string().max(64).nullable().optional(),
  issuer: z.string().max(64),
  whitelist: z.nativeEnum(WhitelistType),
  default_profile_type: z.string().nullable().optional(),
  energy_contract: z.any().nullable().optional(),
  last_updated: z.date(),
});
