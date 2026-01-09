// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { TenantPartnerSchema } from './tenant.partner.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const AsyncJobNameSchema = z.enum(['FETCH_OCPI_TOKENS']);
export const AsyncJobActionSchema = z.enum(['RESUME', 'STOP']);

export type AsyncJobName = z.infer<typeof AsyncJobNameSchema>;
export type AsyncJobAction = z.infer<typeof AsyncJobActionSchema>;

export const PaginatedParamsSchema = z.object({
  offset: z.number().int().optional(),
  limit: z.number().int().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export type PaginatedParams = z.infer<typeof PaginatedParamsSchema>;

export const AsyncJobSchema = BaseSchema.extend({
  jobId: z.string().uuid(),
  jobName: AsyncJobNameSchema,
  tenantPartnerId: z.number().int(),
  tenantPartner: TenantPartnerSchema.optional(),
  finishedAt: z.date().optional(),
  stoppedAt: z.date().nullable().optional(),
  stopScheduled: z.boolean().default(false),
  isFailed: z.boolean().default(false).optional(),
  paginatedParams: PaginatedParamsSchema,
  totalObjects: z.number().int().optional(),
});

export const AsyncJobProps = AsyncJobSchema.keyof().enum;

export type AsyncJobDto = z.infer<typeof AsyncJobSchema>;

export const AsyncJobCreateSchema = AsyncJobSchema.omit({
  jobId: true,
  tenant: true,
  tenantPartner: true,
  updatedAt: true,
  createdAt: true,
});

export type AsyncJobCreate = z.infer<typeof AsyncJobCreateSchema>;

export const AsyncJobRequestSchema = z.object({
  tenantPartnerId: z.number().int(),
  paginatedParams: PaginatedParamsSchema,
});

export type AsyncJobRequest = z.infer<typeof AsyncJobRequestSchema>;

export const asyncJobSchemas = {
  AsyncJob: AsyncJobSchema,
  AsyncJobCreate: AsyncJobCreateSchema,
  AsyncJobRequest: AsyncJobRequestSchema,
};

const asyncJob: AsyncJobDto = {
  tenantId: 1,
  jobId: 'some-uuid',
  jobName: 'FETCH_OCPI_TOKENS',
  tenantPartnerId: 1,
  finishedAt: new Date(),
  stoppedAt: null,
  stopScheduled: false,
  isFailed: false,
  paginatedParams: {
    offset: 0,
    limit: 10,
  },
  totalObjects: 100,
};

asyncJob.jobId = 'another-uuid';
