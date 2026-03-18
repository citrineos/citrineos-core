// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';
import { VariableAttributeSchema } from './variable.attribute.dto.js';

export const BootSchema = BaseSchema.extend({
  id: z.string(),
  lastBootTime: z.iso.datetime().nullable().optional(),
  heartbeatInterval: z.number().int().nullable().optional(),
  bootRetryInterval: z.number().int().nullable().optional(),
  status: z.any(),
  statusInfo: z.record(z.string(), z.any()).nullable().optional(), // JSONB
  getBaseReportOnPending: z.boolean().nullable().optional(),
  pendingBootSetVariables: z.array(VariableAttributeSchema).optional(),
  variablesRejectedOnLastBoot: z.array(z.record(z.string(), z.any())).nullable().optional(),
  bootWithRejectedVariables: z.boolean().nullable().optional(),
  changeConfigurationsOnPending: z.boolean().nullable().optional(),
  getConfigurationsOnPending: z.boolean().nullable().optional(),
});

export const BootProps = BootSchema.keyof().enum;

export type BootDto = z.infer<typeof BootSchema>;

export const BootCreateSchema = BootSchema.omit({
  tenant: true,
  updatedAt: true,
  createdAt: true,
  pendingBootSetVariables: true,
});

export type BootCreate = z.infer<typeof BootCreateSchema>;

export const BootUpdateSchema = BootSchema.partial()
  .omit({
    tenant: true,
    updatedAt: true,
    createdAt: true,
    pendingBootSetVariables: true,
  })
  .required({ id: true, tenantId: true });

export type BootUpdate = z.infer<typeof BootUpdateSchema>;

export const bootSchemas = {
  Boot: BootSchema,
  BootCreate: BootCreateSchema,
  BootUpdate: BootUpdateSchema,
};
