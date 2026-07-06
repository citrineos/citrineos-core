// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { TokenDTOSchema } from './DTO/TokenDTO.js';
import { ResponseUrlSchema } from './ResponseUrl.js';

export const StartSessionSchema = ResponseUrlSchema.extend({
  token: TokenDTOSchema,
  location_id: z.string().max(36),
  evse_uid: z.string().max(36).nullable().optional(),
  connector_id: z.string().max(36).nullable().optional(),
  authorization_reference: z.string().max(36).nullable().optional(),
});
export const StartSessionSchemaName = 'StartSession';

export type StartSession = z.infer<typeof StartSessionSchema>;
