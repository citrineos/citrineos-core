// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { PaymentConfigInput } from '../types.js';
import { CoreAuthMode } from '../types.js';

function integer(name: string): number | undefined {
  const value = process.env[name];
  return value ? parseInt(value) : undefined;
}

/** The settings read from the same variables in every environment. */
export function sharedPaymentSettings(): Pick<
  PaymentConfigInput,
  'admin' | 'rateLimitPerMinute' | 'reconciliation'
> {
  return {
    admin: {
      apiKey: process.env.PAYMENT_ADMIN_API_KEY || undefined,
    },
    rateLimitPerMinute: integer('PAYMENT_RATE_LIMIT_PER_MINUTE'),
    reconciliation: {
      intervalSeconds: integer('PAYMENT_RECONCILE_INTERVAL_SECONDS'),
      staleAfterSeconds: integer('PAYMENT_RECONCILE_STALE_AFTER_SECONDS'),
    },
  };
}

/** `defaultMode` applies when CORE_AUTH_MODE is unset or not a mode this app knows. */
export function coreAuthFromEnv(
  defaultMode?: CoreAuthMode,
): Pick<NonNullable<PaymentConfigInput['core']>, 'authMode' | 'localDevRoles'> {
  const mode = process.env.CORE_AUTH_MODE;
  return {
    authMode: Object.values(CoreAuthMode).find((known) => known === mode) ?? defaultMode,
    localDevRoles: process.env.CORE_LOCAL_DEV_ROLES
      ? process.env.CORE_LOCAL_DEV_ROLES.split(',').map((role) => role.trim())
      : undefined,
  };
}
