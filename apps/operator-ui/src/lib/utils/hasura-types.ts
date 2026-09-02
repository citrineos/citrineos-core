// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export enum HasuraRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum HasuraClaimType {
  X_HASURA_DEFAULT_ROLE = 'x-hasura-default-role',
  X_HASURA_TENANT_ID = 'x-hasura-tenant-id',
  X_HASURA_ALLOWED_ROLES = 'x-hasura-allowed-roles',
}

export enum HasuraHeader {
  X_AUTH_TOKEN = 'x-auth-token',
  X_HASURA_ROLE = 'x-hasura-role',
  X_HASURA_TENANT_ID = 'x-hasura-tenant-id',
  X_HASURA_ADMIN_SECRET = 'x-hasura-admin-secret',
}
