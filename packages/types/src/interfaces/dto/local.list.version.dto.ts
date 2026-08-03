// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { BaseSchema } from './types/base.dto.js';
import { LocalListAuthorizationSchema } from './local.list.authorization.dto.js';

export const LocalListVersionSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  ocppConnectionName: z.string(),
  versionNumber: z.number().int(),
  localAuthorizationList: z
    .array(z.lazy(() => LocalListAuthorizationSchema))
    .nonempty()
    .nullable()
    .optional(),
  customData: z.any().nullable().optional(),
});

export type LocalListVersionDto = z.infer<typeof LocalListVersionSchema>;
export const LocalListVersionCreateSchema = LocalListVersionSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
  localAuthorizationList: true,
});
