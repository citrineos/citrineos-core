// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';
import { StatusInfoSchema } from './types/location.js';
import { VariableAttributeSchema } from './variable.attribute.dto.js';

export const VariableStatusSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  value: z.string().max(4000),
  status: z.string(),
  statusInfo: StatusInfoSchema.nullable().optional(),
  variable: VariableAttributeSchema,
  variableAttributeId: z.number().int().nullable().optional(),
});

export const VariableStatusProps = VariableStatusSchema.keyof().enum;

export type VariableStatusDto = z.infer<typeof VariableStatusSchema>;

export const VariableStatusCreateSchema = VariableStatusSchema.omit({
  id: true,
  tenant: true,
  variable: true,
  updatedAt: true,
  createdAt: true,
});

export type VariableStatusCreate = z.infer<typeof VariableStatusCreateSchema>;

export const variableStatusSchemas = {
  VariableStatus: VariableStatusSchema,
  VariableStatusCreate: VariableStatusCreateSchema,
};
