// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';

interface GetPermissionCatalogEndpointDependencies extends AbstractEndpointDependencies {
  permissionCatalog: Set<string>;
}

export class GetPermissionCatalogEndpoint extends AbstractEndpoint {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Get,
    path: '/',
    description: 'Every permission name this build exposes.',
    responseSchema: {
      type: 'object',
      properties: { permissions: { type: 'array', items: { type: 'string' } } },
      required: ['permissions'],
    },
  };

  private readonly _permissionCatalog: Set<string>;

  constructor({ logger, permissionCatalog }: GetPermissionCatalogEndpointDependencies) {
    super(logger);
    this._permissionCatalog = permissionCatalog;
  }

  async handle(): Promise<{ permissions: string[] }> {
    return { permissions: [...this._permissionCatalog].sort() };
  }
}
