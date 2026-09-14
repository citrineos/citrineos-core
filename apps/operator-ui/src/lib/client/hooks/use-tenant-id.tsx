// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

'use client';

import { useGetIdentity } from '@refinedev/core';
import type { KeycloakUserIdentity } from '@lib/providers/auth-provider/keycloak-auth-provider';
import config from '@lib/utils/config';

/** Retrieves the tenant ID of the logged in user.
 * If none exists, uses the default tenant ID configured. **/
export const useTenantId = (): number => {
  const { data: identity } = useGetIdentity<KeycloakUserIdentity>();
  return Number(identity?.tenantId) || Number(config.tenantId);
};
