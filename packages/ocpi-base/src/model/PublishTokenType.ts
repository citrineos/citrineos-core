// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { TokenType } from './TokenType.js';

export const PublishTokenTypeSchema = z.object({
  uid: z.string().max(36).nullable().optional(),
  type: z.nativeEnum(TokenType).nullable().optional(),
  visual_number: z.string().max(64).nullable().optional(),
  issuer: z.string().max(64).nullable().optional(),
  group_id: z.string().max(36).nullable().optional(),
});

export type PublishTokenType = z.infer<typeof PublishTokenTypeSchema>;
