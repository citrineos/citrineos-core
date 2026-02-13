// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const ComponentVariableSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  componentId: z.number().int(),
  variableId: z.number().int(),
});

export const ComponentVariableProps = ComponentVariableSchema.keyof().enum;

export type ComponentVariableDto = z.infer<typeof ComponentVariableSchema>;

export const ComponentVariableCreateSchema = ComponentVariableSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type ComponentVariableCreate = z.infer<typeof ComponentVariableCreateSchema>;

export const componentVariableSchemas = {
  ComponentVariable: ComponentVariableSchema,
  ComponentVariableCreate: ComponentVariableCreateSchema,
};
