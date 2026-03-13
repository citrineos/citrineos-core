// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';
import { StatusInfoSchema } from './types/location.js';
import { VariableMonitoringSchema } from './variable.monitoring.dto.js';

export const VariableMonitoringStatusSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  status: z.string(),
  statusInfo: StatusInfoSchema.nullable().optional(),
  variable: VariableMonitoringSchema,
  variableMonitoringId: z.number().int().nullable().optional(),
});

export const VariableMonitoringStatusProps = VariableMonitoringStatusSchema.keyof().enum;

export type VariableMonitoringStatusDto = z.infer<typeof VariableMonitoringStatusSchema>;

export const VariableMonitoringStatusCreateSchema = VariableMonitoringStatusSchema.omit({
  id: true,
  tenant: true,
  variable: true,
  updatedAt: true,
  createdAt: true,
});

export type VariableMonitoringStatusCreate = z.infer<typeof VariableMonitoringStatusCreateSchema>;

export const variableMonitoringStatusSchemas = {
  VariableMonitoringStatus: VariableMonitoringStatusSchema,
  VariableMonitoringStatusCreate: VariableMonitoringStatusCreateSchema,
};
