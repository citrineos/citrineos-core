// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { OcpiParamsSchema } from '../../util/OcpiParams.js';

export const GetSessionParamsSchema = OcpiParamsSchema.extend({
  sessionId: z.string().length(36),
});

export type GetSessionParams = z.infer<typeof GetSessionParamsSchema>;
