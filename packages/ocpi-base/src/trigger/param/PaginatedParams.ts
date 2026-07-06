// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../model/PaginatedResponse.js';

export const PaginatedParamsSchema = z.object({
  offset: z.number().int().min(0).optional().default(DEFAULT_OFFSET),
  limit: z.number().int().min(1).optional().default(DEFAULT_LIMIT),
  date_from: z.union([z.coerce.date(), z.string(), z.undefined()]).optional(),
  date_to: z.union([z.coerce.date(), z.string(), z.undefined()]).optional(),
});

export type PaginatedParams = z.infer<typeof PaginatedParamsSchema>;

export const buildPaginatedParams = (
  offset?: number,
  limit?: number,
  dateFrom?: Date,
  dateTo?: Date,
): PaginatedParams => {
  return PaginatedParamsSchema.parse({
    offset,
    limit,
    date_from: dateFrom,
    date_to: dateTo,
  });
};
