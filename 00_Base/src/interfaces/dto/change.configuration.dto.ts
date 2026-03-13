// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const ChangeConfigurationSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  key: z.string(),
  value: z.string().nullable().optional(),
  readonly: z.boolean().nullable().optional(),
});

export const ChangeConfigurationProps = ChangeConfigurationSchema.keyof().enum;

export type ChangeConfigurationDto = z.infer<typeof ChangeConfigurationSchema>;

export const ChangeConfigurationCreateSchema = ChangeConfigurationSchema.omit({
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type ChangeConfigurationCreate = z.infer<typeof ChangeConfigurationCreateSchema>;

export const changeConfigurationSchemas = {
  ChangeConfiguration: ChangeConfigurationSchema,
  ChangeConfigurationCreate: ChangeConfigurationCreateSchema,
};
