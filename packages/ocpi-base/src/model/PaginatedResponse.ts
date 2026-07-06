// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { OcpiResponseSchema, OcpiResponseStatusCode } from './OcpiResponse.js';

export const DEFAULT_LIMIT = 10;
export const DEFAULT_OFFSET = 0;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  OcpiResponseSchema(z.array(itemSchema)).extend({
    total: z.number().int().nonnegative(),
    offset: z.number().int().nonnegative().default(DEFAULT_OFFSET),
    limit: z.number().int().min(0).max(200).default(DEFAULT_LIMIT),
    link: z.string().optional(),
  });

export type PaginatedResponse<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof PaginatedResponseSchema<T>>
>;

export const buildOcpiPaginatedResponse = <T extends z.ZodTypeAny>(
  status_code: OcpiResponseStatusCode,
  total: number,
  limit: number,
  offset: number,
  data?: z.infer<T>[],
  status_message?: string,
): PaginatedResponse<T> => {
  return {
    status_code,
    status_message,
    timestamp: new Date(),
    data,
    total,
    limit,
    offset,
    link: '', // default or you can make this an arg
  };
};
