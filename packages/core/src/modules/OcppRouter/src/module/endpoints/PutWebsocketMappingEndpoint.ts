// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type BootstrapConfig,
  type ConfigStore,
  type ICache,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
  BadRequestError,
  CacheNamespace,
  NotFoundError,
} from '@citrineos/base';
import {
  type SystemConfig,
  type TenantDto,
  type WebsocketServerConfig,
  HttpMethod,
  TENANT_WEBSOCKET_SERVER_PATH_ERROR,
  TENANT_WEBSOCKET_SERVER_PATH_PATTERN,
} from '@citrineos/types';
import type { ITenantRepository, WebsocketMappingQuerystring } from '@dal/interfaces/index.js';
import { WebsocketMappingQuerySchema } from '@dal/interfaces/index.js';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  config: BootstrapConfig & SystemConfig;
  configStore: ConfigStore;
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

  private readonly _config: BootstrapConfig & SystemConfig;
  private readonly _configStore: ConfigStore;
  private readonly _cache: ICache;
  private readonly _tenantRepository: ITenantRepository;

  constructor({ logger, config, configStore, cache, tenantRepository }: Deps) {
    super(logger);
    this._config = config;
    this._configStore = configStore;
    this._cache = cache;
    this._tenantRepository = tenantRepository;
  }

  protected async refreshConfigFromStore(): Promise<void> {
    const stored = await this._configStore.fetchConfig();
    if (stored) {
      Object.assign(this._config, stored);
    }
  }

  protected findWebsocketConfig(serverId: string): WebsocketServerConfig {
    const websocketConfig = this._config.util.networkConnection.websocketServers.find(
      (ws) => ws.id === serverId,
    );
    if (!websocketConfig) {
      throw new NotFoundError(`Websocket configuration with id ${serverId} not found`);
    }
    return websocketConfig;
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
