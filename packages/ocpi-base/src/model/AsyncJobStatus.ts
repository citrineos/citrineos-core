// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export enum AsyncJobName {
  FETCH_OCPI_TOKENS = 'FETCH_OCPI_TOKENS',
}

export const AsyncJobStatusSchema = z.object({
  jobId: z.string().uuid(),
  jobName: z.nativeEnum(AsyncJobName),
  mspCountryCode: z.string(),
  mspPartyId: z.string(),
  cpoCountryCode: z.string(),
  cpoPartyId: z.string(),
  finishedAt: z.date().optional(),
  stoppedAt: z.date().nullable().optional(),
  stopScheduled: z.boolean(),
  isFailed: z.boolean(),
  paginationParams: z.object({
    limit: z.number().optional(),
    offset: z.number().optional(),
  }),
  totalObjects: z.number().optional(),
});

export type AsyncJobStatus = z.infer<typeof AsyncJobStatusSchema>;
