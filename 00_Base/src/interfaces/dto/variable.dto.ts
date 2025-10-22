// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const VariableSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  name: z.string(),
  instance: z.string().nullable().optional(),
});

export const VariableProps = VariableSchema.keyof().enum;

export type VariableDto = z.infer<typeof VariableSchema>;

export const VariableCreateSchema = VariableSchema.omit({
  id: true,
  tenant: true,
  components: true,
  variableAttributes: true,
  variableCharacteristics: true,
  updatedAt: true,
  createdAt: true,
});

export type VariableCreate = z.infer<typeof VariableCreateSchema>;

export const variableSchemas = {
  Variable: VariableSchema,
  VariableCreate: VariableCreateSchema,
};
