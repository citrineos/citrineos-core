// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ResponseUrlSchema } from './ResponseUrl.js';

export const StopSessionSchema = ResponseUrlSchema.extend({
  session_id: z.string().max(36).min(1),
});
export const StopSessionSchemaName = 'StopSession';

export type StopSession = z.infer<typeof StopSessionSchema>;
