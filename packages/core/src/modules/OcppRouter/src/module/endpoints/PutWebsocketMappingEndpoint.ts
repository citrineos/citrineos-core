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
  getCacheTenantPathMappingKey,
  NotFoundError,
} from '@citrineos/base';
import { type SystemConfig, type WebsocketServerConfig, HttpMethod } from '@citrineos/types';
import type {
  IServerNetworkProfileRepository,
  WebsocketMappingQuerystring,
} from '@dal/interfaces/index.js';
import { WebsocketMappingQuerySchema } from '@dal/interfaces/index.js';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  config: BootstrapConfig & SystemConfig;
  configStore: ConfigStore;
  cache: ICache;
  serverNetworkProfileRepository: IServerNetworkProfileRepository;
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
  private readonly _serverNetworkProfileRepository: IServerNetworkProfileRepository;

  constructor({ logger, config, configStore, cache, serverNetworkProfileRepository }: Deps) {
    super(logger);
    this._config = config;
    this._configStore = configStore;
    this._cache = cache;
    this._serverNetworkProfileRepository = serverNetworkProfileRepository;
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

  async handle(request: FastifyRequest<Route>): Promise<WebsocketServerConfig> {
    const { id: serverId, path, tenantId } = request.query;

    await this.refreshConfigFromStore();
    const websocketConfig = this.findWebsocketConfig(serverId);

    if (!websocketConfig.tenantPathMapping) {
      websocketConfig.tenantPathMapping = {};
    }

    if (
      websocketConfig.tenantPathMapping[path] !== undefined &&
      websocketConfig.tenantPathMapping[path] !== tenantId
    ) {
      throw new BadRequestError(
        `Path ${path} is already mapped to tenant ${websocketConfig.tenantPathMapping[path]}`,
      );
    }

    websocketConfig.tenantPathMapping[path] = tenantId;
    websocketConfig.dynamicTenantResolution = true;

    await this._configStore.saveConfig(this._config);
    await this._serverNetworkProfileRepository.upsertServerNetworkProfile(
      websocketConfig,
      this._config.maxCallLengthSeconds,
    );
    await this._cache.set(
      getCacheTenantPathMappingKey(websocketConfig.id, path),
      tenantId.toString(),
      CacheNamespace.TenantPathMapping,
    );

    return websocketConfig;
  }
}
