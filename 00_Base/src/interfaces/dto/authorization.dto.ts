// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { TenantPartnerSchema } from './tenant.partner.dto.js';
import { AdditionalInfoSchema } from './types/authorization.js';
import { BaseSchema } from './types/base.dto.js';
import {
  AuthorizationStatusEnumSchema,
  AuthorizationWhitelistEnumSchema,
  IdTokenEnumSchema,
} from './types/enums.js';

const authorizationFields = {
  id: z.number().int().optional(),
  allowedConnectorTypes: z.array(z.string()).optional(),
  disallowedEvseIdPrefixes: z.array(z.string()).optional(),
  idToken: z.string(),
  idTokenType: IdTokenEnumSchema.nullable().optional(),
  additionalInfo: z.tuple([AdditionalInfoSchema]).rest(AdditionalInfoSchema).nullable().optional(),
  status: AuthorizationStatusEnumSchema,
  cacheExpiryDateTime: z.iso.datetime().nullable().optional(),
  chargingPriority: z.number().int().nullable().optional(),
  language1: z.string().nullable().optional(),
  language2: z.string().nullable().optional(),
  personalMessage: z.any().nullable().optional(),
  concurrentTransaction: z.boolean().optional(),
  realTimeAuth: AuthorizationWhitelistEnumSchema.nullable().optional(),
  realTimeAuthUrl: z.string().optional(),
  tenantPartnerId: z.number().int().nullable().optional(),
  tenantPartner: TenantPartnerSchema.nullable().optional(),
};

export const GroupAuthorizationSchema = BaseSchema.extend(authorizationFields);

export type GroupAuthorizationDto = z.infer<typeof GroupAuthorizationSchema>;

export const AuthorizationSchema = BaseSchema.extend({
  ...authorizationFields,
  groupAuthorizationId: z.number().int().nullable().optional(),
  groupAuthorization: z.lazy(() => GroupAuthorizationSchema).optional(),
});

export const AuthorizationProps = AuthorizationSchema.keyof().enum;

export type AuthorizationDto = z.infer<typeof AuthorizationSchema>;

export const AuthorizationCreateSchema = AuthorizationSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
  groupAuthorization: true,
  tenantPartner: true,
});

export type AuthorizationCreate = z.infer<typeof AuthorizationCreateSchema>;

export const AuthorizationUpdateSchema = AuthorizationSchema.partial()
  .omit({
    tenant: true,
    updatedAt: true,
    createdAt: true,
    groupAuthorization: true,
    tenantPartner: true,
  })
  .required({ id: true, tenantId: true });

export type AuthorizationUpdate = z.infer<typeof AuthorizationUpdateSchema>;

export const authorizationSchemas = {
  Authorization: AuthorizationSchema,
  AuthorizationCreate: AuthorizationCreateSchema,
  AuthorizationUpdate: AuthorizationUpdateSchema,
};
