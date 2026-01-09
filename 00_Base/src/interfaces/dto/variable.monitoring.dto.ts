// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ComponentSchema } from './component.dto.js';
import { BaseSchema } from './types/base.dto.js';
import { VariableSchema } from './variable.dto.js';

export const VariableMonitoringSchema = BaseSchema.extend({
  databaseId: z.number().int(),
  id: z.number().int().optional(),
  stationId: z.string(),
  transaction: z.boolean(),
  value: z.number().int(),
  type: z.string(),
  severity: z.number().int(),
  variable: VariableSchema,
  variableId: z.number().int().nullable().optional(),
  component: ComponentSchema,
  componentId: z.number().int().nullable().optional(),
});

export const VariableMonitoringProps = VariableMonitoringSchema.keyof().enum;

export type VariableMonitoringDto = z.infer<typeof VariableMonitoringSchema>;

export const VariableMonitoringCreateSchema = VariableMonitoringSchema.omit({
  databaseId: true,
  tenant: true,
  variable: true,
  component: true,
  updatedAt: true,
  createdAt: true,
});

export type VariableMonitoringCreate = z.infer<typeof VariableMonitoringCreateSchema>;

export const variableMonitoringSchemas = {
  VariableMonitoring: VariableMonitoringSchema,
  VariableMonitoringCreate: VariableMonitoringCreateSchema,
};
