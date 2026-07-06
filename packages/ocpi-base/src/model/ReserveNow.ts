// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ResponseUrlSchema } from './ResponseUrl.js';
import { TokenDTOSchema } from './DTO/TokenDTO.js';
import { z } from 'zod';

export const ReserveNowSchema = ResponseUrlSchema.extend({
  token: TokenDTOSchema,
  expiry_date: z.coerce.date(),
  reservation_id: z.string().max(36),
  location_id: z.string().max(36),
  evse_uid: z.string().max(36).nullable().optional(),
  authorization_reference: z.string().max(36).nullable().optional(),
});
export const ReserveNowSchemaName = 'ReserveNow';

export type ReserveNow = z.infer<typeof ReserveNowSchema>;
