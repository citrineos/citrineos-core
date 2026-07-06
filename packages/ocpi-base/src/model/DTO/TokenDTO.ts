// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { TokenType } from '../TokenType.js';
import { WhitelistType } from '../WhitelistType.js';
import { OcpiResponseSchema } from '../OcpiResponse.js';
import { PaginatedResponseSchema } from '../PaginatedResponse.js';
import { TokenEnergyContractSchema } from '../TokenEnergyContract.js';

export const TokenDTOSchema = z.object({
  country_code: z.string().length(2),
  party_id: z.string().max(3),
  uid: z.string().max(36),
  type: z.nativeEnum(TokenType),
  contract_id: z.string().max(36),
  visual_number: z.string().max(64).nullable().optional(),
  issuer: z.string().max(64),
  group_id: z.string().max(36).nullable().optional(),
  valid: z.boolean(),
  whitelist: z.nativeEnum(WhitelistType),
  language: z.string().length(2).nullable().optional(),
  default_profile_type: z.string().nullable().optional(),
  energy_contract: TokenEnergyContractSchema.nullable().optional(),
  last_updated: z.coerce.date(),
});
export const TokenDTOSchemaName = 'TokenDTOSchema';

export type TokenDTO = z.infer<typeof TokenDTOSchema>;

export const TokenResponseSchema = OcpiResponseSchema(TokenDTOSchema);
export const TokenResponseSchemaName = 'TokenResponseSchema';

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export const PaginatedTokenResponseSchema = PaginatedResponseSchema(TokenDTOSchema);

export type PaginatedTokenResponse = z.infer<typeof PaginatedTokenResponseSchema>;

export const SingleTokenRequestSchema = z.object({
  country_code: z.string().length(2),
  party_id: z.string().max(3),
  uid: z.string().max(36),
  type: z.nativeEnum(TokenType).optional(),
});

export type SingleTokenRequest = z.infer<typeof SingleTokenRequestSchema>;
