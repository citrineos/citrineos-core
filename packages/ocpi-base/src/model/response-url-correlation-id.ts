// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const ResponseUrlCorrelationIdSchema = z.object({
  correlationId: z.string(),
  responseUrl: z.string(),
  params: z.any().optional(),
});

export type ResponseUrlCorrelationId = z.infer<typeof ResponseUrlCorrelationIdSchema>;
