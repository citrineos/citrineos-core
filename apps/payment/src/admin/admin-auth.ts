// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { timingSafeEqual } from 'node:crypto';
import type { PaymentConfig } from '../config/types.js';
import { PaymentError, PaymentErrorCode } from '../services/errors.js';
import type { ICorePermissions } from './core-permissions.js';

/**
 * What each /api/admin route needs, granted through Core's roles: Core's role seed lists them,
 * and Core's `roles.externalPermissions` puts them in its permission catalog.
 */
export const PaymentPermission = {
  AccountsGet: 'payment.accounts.get',
  AccountsPut: 'payment.accounts.put',
  AccountsDelete: 'payment.accounts.delete',
  CheckoutsGet: 'payment.checkouts.get',
  CheckoutsSettle: 'payment.checkouts.settle',
  CheckoutsCancel: 'payment.checkouts.cancel',
} as const;
export type PaymentPermission = (typeof PaymentPermission)[keyof typeof PaymentPermission];

/** Whom an admin credential speaks for: every tenant, or one. */
export const AdminScope = {
  Platform: 'platform',
  Tenant: 'tenant',
} as const;
export type AdminScope = (typeof AdminScope)[keyof typeof AdminScope];

export type AdminPrincipal =
  | { scope: typeof AdminScope.Platform }
  | { scope: typeof AdminScope.Tenant; tenantId: number };

export interface IAdminAuthenticator {
  /** Throws `unauthorized` without credentials and `forbidden` for ones that do not grant `permission`. */
  authenticate(
    authorization: string | undefined,
    permission: PaymentPermission,
  ): Promise<AdminPrincipal>;
}

/**
 * Accepts the platform's API key, for every tenant, or whatever credentials Core accepts, for the
 * caller's tenant and with the permissions Core's roles grant it. Core decides in each of its
 * auth modes: a jwt-mode token, a localDev token, or, under localBypass, anyone.
 */
export class AdminAuthenticator implements IAdminAuthenticator {
  private readonly _apiKey?: Buffer;

  constructor(
    config: PaymentConfig['admin'],
    private readonly _core: ICorePermissions,
  ) {
    this._apiKey = config.apiKey ? Buffer.from(config.apiKey) : undefined;
  }

  async authenticate(
    authorization: string | undefined,
    permission: PaymentPermission,
  ): Promise<AdminPrincipal> {
    const bearer = /^Bearer\s+(\S+)$/i.exec(authorization ?? '')?.[1];
    if (bearer !== undefined && this._isApiKey(bearer)) {
      return { scope: AdminScope.Platform };
    }

    const caller = await this._core.forCaller(authorization);
    if (!caller) {
      throw authorization
        ? new PaymentError(PaymentErrorCode.Forbidden, 'Core does not accept these credentials')
        : new PaymentError(
            PaymentErrorCode.Unauthorized,
            'An Authorization: Bearer header is required',
          );
    }
    if (caller.enforcing && !caller.permissions.includes(permission)) {
      throw new PaymentError(PaymentErrorCode.Forbidden, `Missing permission ${permission}`);
    }
    return { scope: AdminScope.Tenant, tenantId: caller.tenantId };
  }

  private _isApiKey(credential: string): boolean {
    if (!this._apiKey) {
      return false;
    }
    const given = Buffer.from(credential);
    return given.length === this._apiKey.length && timingSafeEqual(given, this._apiKey);
  }
}
