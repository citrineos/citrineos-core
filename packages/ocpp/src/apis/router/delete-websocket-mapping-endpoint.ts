// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICache,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
  CacheNamespace,
  NotFoundError,
} from '@citrineos/base';
import { type TenantDto, HttpMethod } from '@citrineos/types';
import type { ITenantRepository, WebsocketMappingDeleteQuerystring } from '@citrineos/dal';
import { WebsocketMappingDeleteQuerySchema } from '@citrineos/dal';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  cache: ICache;
  tenantRepository: ITenantRepository;
}

type Route = { Querystring: WebsocketMappingDeleteQuerystring };

export class DeleteWebsocketMappingEndpoint extends AbstractEndpoint<Route> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Delete,
    path: '/websocketMapping',
    querySchema: WebsocketMappingDeleteQuerySchema,
  };

  private readonly _cache: ICache;
  private readonly _tenantRepository: ITenantRepository;

  constructor({ logger, cache, tenantRepository }: Deps) {
    super(logger);
    this._cache = cache;
    this._tenantRepository = tenantRepository;
  }

  async handle(request: FastifyRequest<Route>): Promise<TenantDto> {
    const { tenantId } = request.query;

    const tenant = await this._tenantRepository.readByKey(tenantId, tenantId);
    if (!tenant) {
      throw new NotFoundError(`Tenant with id ${tenantId} not found`);
    }

    if (!tenant.tenantWebsocketServerPath) {
      throw new NotFoundError(`Tenant with id ${tenantId} has no websocket path mapping`);
    }

    const removedPath = tenant.tenantWebsocketServerPath;
    const updatedTenant = await this._tenantRepository.updateWebsocketServerPath(tenantId, null);
    if (!updatedTenant) {
      throw new NotFoundError(`Tenant with id ${tenantId} not found`);
    }

    await this._cache.remove(removedPath, CacheNamespace.TenantPathMapping);

    return updatedTenant;
  }
}
