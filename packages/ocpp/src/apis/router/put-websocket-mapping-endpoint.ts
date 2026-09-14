// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICache,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
  BadRequestError,
  CacheNamespace,
  NotFoundError,
} from '@citrineos/base';
import {
  type TenantDto,
  HttpMethod,
  TENANT_WEBSOCKET_SERVER_PATH_ERROR,
  TENANT_WEBSOCKET_SERVER_PATH_PATTERN,
} from '@citrineos/types';
import type { ITenantRepository, WebsocketMappingQuerystring } from '@citrineos/dal';
import { WebsocketMappingQuerySchema } from '@citrineos/dal';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  cache: ICache;
  tenantRepository: ITenantRepository;
}

type Route = { Querystring: WebsocketMappingQuerystring };

export class PutWebsocketMappingEndpoint extends AbstractEndpoint<Route> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Put,
    path: '/websocketMapping',
    querySchema: WebsocketMappingQuerySchema,
  };

  private readonly _cache: ICache;
  private readonly _tenantRepository: ITenantRepository;

  constructor({ logger, cache, tenantRepository }: Deps) {
    super(logger);
    this._cache = cache;
    this._tenantRepository = tenantRepository;
  }

  async handle(request: FastifyRequest<Route>): Promise<TenantDto> {
    const { path, tenantId } = request.query;

    // Upgrade requests resolve the tenant from a single URL segment, so a multi-segment
    // path would let this tenant claim a URL whose resolving segment is another tenant's
    // path. See TENANT_WEBSOCKET_SERVER_PATH_PATTERN.
    if (!TENANT_WEBSOCKET_SERVER_PATH_PATTERN.test(path)) {
      throw new BadRequestError(TENANT_WEBSOCKET_SERVER_PATH_ERROR);
    }

    const tenant = await this._tenantRepository.readByKey(tenantId, tenantId);
    if (!tenant) {
      throw new NotFoundError(`Tenant with id ${tenantId} not found`);
    }

    const pathOwner = await this._tenantRepository.readByWebsocketServerPath(path);
    if (pathOwner && pathOwner.id !== tenantId) {
      throw new BadRequestError(`Path ${path} is already mapped to tenant`);
    }

    const previousPath = tenant.tenantWebsocketServerPath;
    const updatedTenant = await this._tenantRepository.updateWebsocketServerPath(tenantId, path);
    if (!updatedTenant) {
      throw new NotFoundError(`Tenant with id ${tenantId} not found`);
    }

    // A tenant has at most one path, so a changed path leaves a stale cache entry behind.
    if (previousPath && previousPath !== path) {
      await this._cache.remove(previousPath, CacheNamespace.TenantPathMapping);
    }
    await this._cache.set(path, tenantId.toString(), CacheNamespace.TenantPathMapping);

    return updatedTenant;
  }
}
