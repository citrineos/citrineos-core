// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { BaseSchema } from './types/base.dto.js';
import { AuthorizationSchema } from './authorization.dto.js';

export const LocalListAuthorizationSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  allowedConnectorTypes: z.array(z.string()).optional(),
  disallowedEvseIdPrefixes: z.array(z.string()).optional(),
  idToken: z.string(),
  idTokenType: z.string().nullable().optional(),
  additionalInfo: z.any().nullable().optional(), // JSONB
  status: z.string(),
  cacheExpiryDateTime: z.iso.datetime().nullable().optional(),
  chargingPriority: z.number().int().nullable().optional(),
  language1: z.string().nullable().optional(),
  language2: z.string().nullable().optional(),
  personalMessage: z.any().nullable().optional(),
  groupAuthorizationId: z.number().int().nullable().optional(),
  groupAuthorization: z.lazy(() => AuthorizationSchema).optional(),
  authorizationId: z.number().int().optional(),
  authorization: z.lazy(() => AuthorizationSchema).optional(),
  customData: z.any().nullable().optional(),
});

export type LocalListAuthorizationDto = z.infer<typeof LocalListAuthorizationSchema>;

export const LocalListAuthorizationCreateSchema = LocalListAuthorizationSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
  groupAuthorization: true,
  authorization: true,
  sendLocalLists: true,
  localListVersions: true,
});

export const localListAuthorizationSchemas = {
  LocalListAuthorization: LocalListAuthorizationSchema,
  LocalListAuthorizationCreate: LocalListAuthorizationCreateSchema,
};
