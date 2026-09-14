// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KoaMiddlewareInterface } from 'routing-controllers';
import type { Context, Next } from 'koa';
import type { OcpiConfig } from '../../config/ocpi-types.js';
import type { OcpiConfiguredDependencies } from '../../dependencies.js';
import { oidcAuthMiddleware } from '../security/oidc-auth-middleware.js';

export class AdminAuthMiddleware implements KoaMiddlewareInterface {
  private readonly config: OcpiConfig;

  constructor({ config }: OcpiConfiguredDependencies) {
    this.config = config;
  }

  async use(context: Context, next: Next): Promise<unknown> {
    if (this.config.oidc) {
      return oidcAuthMiddleware(this.config.oidc)(context, next);
    }
    return next();
  }
}
