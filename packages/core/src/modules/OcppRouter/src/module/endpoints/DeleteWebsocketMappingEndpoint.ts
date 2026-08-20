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
  CacheNamespace,
  NotFoundError,
} from '@citrineos/base';
import {
  type SystemConfig,
  type TenantDto,
  type WebsocketServerConfig,
  HttpMethod,
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

export class DeleteWebsocketMappingEndpoint extends AbstractEndpoint<Route> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Delete,
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
