// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const EvseTypeSchema = BaseSchema.extend({
  databaseId: z.number().int().optional(),
  id: z.number().int(),
  connectorId: z.number().int().nullable().optional(),
});

export const EvseTypeProps = EvseTypeSchema.keyof().enum;

export type EvseTypeDto = z.infer<typeof EvseTypeSchema>;

export const EvseTypeCreateSchema = EvseTypeSchema.omit({
  databaseId: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type EvseTypeCreate = z.infer<typeof EvseTypeCreateSchema>;

export const evseTypeSchemas = {
  EvseType: EvseTypeSchema,
  EvseTypeCreate: EvseTypeCreateSchema,
};
