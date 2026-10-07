// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod, type SystemConfig } from '@citrineos/types';
import type { FastifyRequest } from 'fastify';
import type { PolicyStore } from '../authorization/policy/policy-store.js';

interface Deps extends AbstractEndpointDependencies {
  config: SystemConfig;
  policyStore: PolicyStore;
}

interface UserPermissions {
  roles: string[];
  resources: Record<string, string[]>;
  permissions: string[];
  enforcing: boolean;
}

export class GetUserPermissionsEndpoint extends AbstractEndpoint {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Get,
    path: '/user',
    description: "The caller's effective permissions, and whether this server enforces them.",
  };

  private readonly _config: SystemConfig;
  private readonly _policyStore: PolicyStore;

  constructor({ logger, config, policyStore }: Deps) {
    super(logger);
    this._config = config;
    this._policyStore = policyStore;
  }

  async handle(request: FastifyRequest): Promise<UserPermissions> {
    const roles = request.user?.roles ?? [];
    return {
      roles,
      ...this._policyStore.permissionsFor(roles),
      enforcing: this._config.auth.mode !== 'localBypass',
    };
  }
}
