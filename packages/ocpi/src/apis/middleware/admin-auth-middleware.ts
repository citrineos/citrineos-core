// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KoaMiddlewareInterface } from 'routing-controllers';
import type { Context, Next } from 'koa';
import type { OcpiConfig } from '../../config/ocpi-types.js';
import type { OcpiConfiguredDependencies } from '../../server/dependencies.js';
import { oidcAuthMiddleware } from './oidc-auth-middleware.js';

export class AdminAuthMiddleware implements KoaMiddlewareInterface {
  private readonly config: OcpiConfig;
  private readonly oidcMiddleware?: (context: Context, next: Next) => Promise<unknown>;

  constructor({ config }: OcpiConfiguredDependencies) {
    this.config = config;
    this.oidcMiddleware = config?.oidc ? oidcAuthMiddleware(config.oidc) : undefined;
  }

  async use(context: Context, next: Next): Promise<unknown> {
    if (this.oidcMiddleware) {
      return this.oidcMiddleware(context, next);
    }
    return next();
  }
}
