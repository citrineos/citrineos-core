// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import { HttpMethod, type SystemConfig } from '@citrineos/types';
import jwt from 'jsonwebtoken';
import type { FastifyRequest } from 'fastify';
import { DEV_ISSUER, type DevKeyPair } from './dev-key-pair.js';

interface DevTokenBody {
  roles?: string[];
  tenantId?: string | number;
}

interface Deps extends AbstractEndpointDependencies {
  config: SystemConfig;
  devKeyPair: DevKeyPair;
}

type Route = { Body: DevTokenBody };

export class DevTokenEndpoint extends AbstractEndpoint<Route> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Post,
    path: '/token',
    description: 'Development only. Mints a signed token for the requested roles.',
    bodySchema: {
      type: 'object',
      properties: {
        roles: { type: 'array', items: { type: 'string' } },
        tenantId: { type: ['string', 'number'] },
      },
    },
  };

  private readonly _config: SystemConfig;
  private readonly _devKeyPair: DevKeyPair;

  constructor({ logger, config, devKeyPair }: Deps) {
    super(logger);
    this._config = config;
    this._devKeyPair = devKeyPair;
  }

  async handle(request: FastifyRequest<Route>): Promise<{ accessToken: string }> {
    const { roles: requestedRoles, tenantId } = request.body ?? {};
    const roles = requestedRoles?.length ? requestedRoles : this._config.auth.localDev.roles;
    const jwtConfig = this._config.auth.jwt;

    const accessToken = jwt.sign(
      {
        [jwtConfig?.rolesClaim ?? 'roles']: roles,
        [jwtConfig?.tenantClaim ?? 'tenant_id']: String(tenantId ?? DEFAULT_TENANT_ID),
        preferred_username: `local-${roles.join('-')}`,
      },
      this._devKeyPair.privateKey,
      {
        algorithm: 'RS256',
        keyid: this._devKeyPair.keyId,
        issuer: DEV_ISSUER,
        subject: `local-${roles.join('-')}`,
        expiresIn: this._config.auth.localDev.tokenTtlSeconds,
      },
    );

    return { accessToken };
  }
}
