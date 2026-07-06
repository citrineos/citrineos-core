// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { OcpiParamsSchema } from '../../util/OcpiParams.js';
import { SessionSchema } from '../../../model/Session.js';

export const PatchSessionParamsSchema = OcpiParamsSchema.extend({
  sessionId: z.string().length(36),
  requestBody: SessionSchema.partial(),
});

export type PatchSessionParams = z.infer<typeof PatchSessionParamsSchema>;
