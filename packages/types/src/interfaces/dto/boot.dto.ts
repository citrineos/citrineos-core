// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';
import { VariableAttributeSchema } from './variable.attribute.dto.js';

export const BootSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.number().int(),
  lastBootTime: z.iso.datetime().nullable().optional(),
  /**
   *  Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  heartbeatInterval: z.number().int().nullable().optional(),
  /**
   * Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  bootRetryInterval: z.number().int().nullable().optional(),
  status: z.any(),
  statusInfo: z.record(z.string(), z.any()).nullable().optional(), // JSONB
  /**
   * Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  getBaseReportOnPending: z.boolean().nullable().optional(),
  /**
   * Ids of variable attributes to be sent in SetVariablesRequest on pending boot
   */
  pendingBootSetVariables: z.array(VariableAttributeSchema).optional(),
  pendingBootSetVariableIds: z.array(z.number().int()).optional(),
  variablesRejectedOnLastBoot: z.array(z.record(z.string(), z.any())).nullable().optional(),
  /**
   * Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  bootWithRejectedVariables: z.boolean().nullable().optional(),
  /**
   * Specifically for OCPP 1.6 which plays similar role to pendingBootSetVariableIds
   */
  changeConfigurationsOnPending: z.boolean().nullable().optional(),
  /**
   * Specifically for OCPP 1.6 which plays similar role to getBaseReportOnPending
   */
  getConfigurationsOnPending: z.boolean().nullable().optional(),
});

export const BootProps = BootSchema.keyof().enum;

export type BootDto = z.infer<typeof BootSchema>;

export const BootCreateSchema = BootSchema.omit({
  id: true,
  tenant: true,
  stationId: true,
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
  .required({ stationId: true, tenantId: true });

export type BootUpdate = z.infer<typeof BootUpdateSchema>;

export const bootSchemas = {
  Boot: BootSchema,
  BootCreate: BootCreateSchema,
  BootUpdate: BootUpdateSchema,
};
