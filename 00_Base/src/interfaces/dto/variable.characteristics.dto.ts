// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';
import { DataEnumSchema } from './types/device.model.js';
import { VariableSchema } from './variable.dto.js';

export const VariableCharacteristicsSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  unit: z.string().nullable().optional(),
  dataType: DataEnumSchema,
  minLimit: z.number().nullable().optional(), // DECIMAL in DB
  maxLimit: z.number().nullable().optional(), // DECIMAL in DB
  valuesList: z.string().max(4000).nullable().optional(),
  supportsMonitoring: z.boolean(),
  variable: VariableSchema,
  variableId: z.number().int().nullable().optional(),
});

export const VariableCharacteristicsProps = VariableCharacteristicsSchema.keyof().enum;

export type VariableCharacteristicsDto = z.infer<typeof VariableCharacteristicsSchema>;

export const VariableCharacteristicsCreateSchema = VariableCharacteristicsSchema.omit({
  id: true,
  tenant: true,
  variable: true,
  updatedAt: true,
  createdAt: true,
});

export type VariableCharacteristicsCreate = z.infer<typeof VariableCharacteristicsCreateSchema>;

export const variableCharacteristicsSchemas = {
  VariableCharacteristics: VariableCharacteristicsSchema,
  VariableCharacteristicsCreate: VariableCharacteristicsCreateSchema,
};
