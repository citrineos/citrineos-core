// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { BaseSchema } from './types/base.dto.js';
import { LocalListAuthorizationSchema } from './local.list.authorization.dto.js';

export const SendLocalListSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  ocppConnectionName: z.string(),
  correlationId: z.string(),
  versionNumber: z.number().int(),
  updateType: z.string(),
  localAuthorizationList: z
    .array(z.lazy(() => LocalListAuthorizationSchema))
    .nullable()
    .optional(),
  customData: z.any().nullable().optional(),
});

export type SendLocalListDto = z.infer<typeof SendLocalListSchema>;

export const SendLocalListCreateSchema = SendLocalListSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
  localAuthorizationList: true,
});

export const sendLocalListSchemas = {
  SendLocalList: SendLocalListSchema,
  SendLocalListCreate: SendLocalListCreateSchema,
};
