// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { EvseTypeSchema } from './evse.type.dto.js';
import { BaseSchema } from './types/base.dto.js';
import { VariableSchema } from './variable.dto.js';

export const ComponentSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  name: z.string(),
  instance: z.string().nullable().optional(),
  evse: EvseTypeSchema.optional(),
  evseDatabaseId: z.number().int().nullable().optional(),
  variables: z.array(VariableSchema).optional(),
});

export const ComponentProps = ComponentSchema.keyof().enum;

export type ComponentDto = z.infer<typeof ComponentSchema>;

export const ComponentCreateSchema = ComponentSchema.omit({
  id: true,
  tenant: true,
  evse: true,
  variables: true,
  updatedAt: true,
  createdAt: true,
});

export type ComponentCreate = z.infer<typeof ComponentCreateSchema>;

export const componentSchemas = {
  Component: ComponentSchema,
  ComponentCreate: ComponentCreateSchema,
};
