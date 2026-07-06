// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../model/PaginatedResponse.js';
import { OcpiParamsSchema } from '../util/OcpiParams.js';
import { v4 as uuidv4 } from 'uuid';

export const PaginatedOcpiParamsSchema = OcpiParamsSchema.extend({
  offset: z.number().int().min(0).optional().default(DEFAULT_OFFSET),
  limit: z.number().int().min(1).optional().default(DEFAULT_LIMIT),
  date_from: z.union([z.coerce.date(), z.string(), z.undefined()]).optional(),
  date_to: z.union([z.coerce.date(), z.string(), z.undefined()]).optional(),
});

export type PaginatedOcpiParams = z.infer<typeof PaginatedOcpiParamsSchema>;

export const buildPaginatedOcpiParams = (
  toCountryCode: string,
  toPartyId: string,
  fromCountryCode: string,
  fromPartyId: string,
  authorization: string,
  offset?: number,
  limit?: number,
  dateFrom?: Date,
  dateTo?: Date,
): PaginatedOcpiParams => {
  return PaginatedOcpiParamsSchema.parse({
    toCountryCode,
    toPartyId,
    fromCountryCode,
    fromPartyId,
    authorization,
    xRequestId: uuidv4(),
    xCorrelationId: uuidv4(),
    offset,
    limit,
    date_from: dateFrom,
    date_to: dateTo,
  });
};
