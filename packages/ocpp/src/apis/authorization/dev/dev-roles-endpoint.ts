// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { PolicyStore } from '../policy/policy-store.js';

interface Deps extends AbstractEndpointDependencies {
  policyStore: PolicyStore;
}

export class DevRolesEndpoint extends AbstractEndpoint {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Get,
    path: '/roles',
    description: 'Development only. Roles available to sign in as.',
  };

  private readonly _policyStore: PolicyStore;

  constructor({ logger, policyStore }: Deps) {
    super(logger);
    this._policyStore = policyStore;
  }

  async handle(): Promise<{ roles: string[] }> {
    return { roles: this._policyStore.roleNames() };
  }
}
