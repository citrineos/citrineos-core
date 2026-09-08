// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ServerProfileSchema } from './types/ocpi-registration.js';

/**
 * A tenant websocket path is matched against exactly ONE segment of the upgrade URL
 * (`/{tenantWebsocketServerPath}/{stationId}`), so it must itself be a single segment.
 * A path containing a separator would let a tenant register something whose last segment
 * belongs to another tenant (e.g. tenant 2 registering `tenant2/tenant1`), and connections
 * to it would resolve to that other tenant. Restricting the value to unreserved URL
 * characters also keeps the stored value and the request segment literally comparable —
 * no percent-encoding ambiguity.
 */
export const TENANT_WEBSOCKET_SERVER_PATH_PATTERN = /^[A-Za-z0-9._~-]{1,255}$/;

export const TENANT_WEBSOCKET_SERVER_PATH_ERROR =
  'tenantWebsocketServerPath must be a single URL path segment containing only letters, digits, and the characters . _ ~ -';

export const TenantSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  url: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  partyId: z.string().nullable().optional(),
  serverProfileOCPI: ServerProfileSchema.nullable().optional(),
  isUserTenant: z.boolean().default(false),
  maxChargingStations: z.number().int().nullable().optional(),
  // URL path segment this tenant is reachable under on every websocket server that has
  // dynamicTenantResolution enabled (e.g. `wss://host:port/{path}/{stationId}`).
  // Unique across tenants so a path resolves to exactly one tenant.
  tenantWebsocketServerPath: z
    .string()
    .regex(TENANT_WEBSOCKET_SERVER_PATH_PATTERN, TENANT_WEBSOCKET_SERVER_PATH_ERROR)
    .nullable()
    .optional(),
  updatedAt: z.date().optional(),
  createdAt: z.date().optional(),
});

export const TenantProps = TenantSchema.keyof().enum;

export type TenantDto = z.infer<typeof TenantSchema>;

export const TenantCreateSchema = TenantSchema.omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});

export type TenantCreate = z.infer<typeof TenantCreateSchema>;

export const TenantUpdateSchema = TenantSchema.partial().omit({
  updatedAt: true,
  createdAt: true,
});

export type TenantUpdate = z.infer<typeof TenantUpdateSchema>;

export const tenantSchemas = {
  Tenant: TenantSchema,
  TenantCreate: TenantCreateSchema,
  TenantUpdate: TenantUpdateSchema,
};
