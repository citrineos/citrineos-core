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
import { type SystemConfig, type WebsocketServerConfig, HttpMethod } from '@citrineos/types';
import type {
  IServerNetworkProfileRepository,
  WebsocketMappingQuerystring,
} from '@dal/interfaces/index.js';
import { WebsocketMappingQuerySchema } from '@dal/interfaces/index.js';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  config: SystemConfig;
  cache: ICache;
  serverNetworkProfileRepository: IServerNetworkProfileRepository;
}

type Route = { Querystring: WebsocketMappingQuerystring };

export class DeleteWebsocketMappingEndpoint extends AbstractEndpoint<Route> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Delete,
    path: '/websocketMapping',
    querySchema: WebsocketMappingQuerySchema,
  };

  private readonly _config: SystemConfig;
  private readonly _cache: ICache;
  private readonly _serverNetworkProfileRepository: IServerNetworkProfileRepository;

  constructor({ logger, config, cache, serverNetworkProfileRepository }: Deps) {
    super(logger);
    this._config = config;
    this._cache = cache;
    this._serverNetworkProfileRepository = serverNetworkProfileRepository;
  }

  async handle(request: FastifyRequest<Route>): Promise<WebsocketServerConfig> {
    const { id: serverId, path, tenantId } = request.query;

    await this.refreshConfigFromStore();
    const websocketConfig = this.findWebsocketConfig(serverId);

    if (websocketConfig.tenantPathMapping) {
      if (websocketConfig.tenantPathMapping[path] === undefined) {
        throw new NotFoundError(
          `Mapping for path ${path} not found in websocket configuration ${serverId}`,
        );
      } else if (websocketConfig.tenantPathMapping[path] !== tenantId) {
        throw new BadRequestError(`Mapping for path ${path} is not mapped to tenant ${tenantId}`);
      } else if (websocketConfig.tenantPathMapping[path] === tenantId) {
        delete websocketConfig.tenantPathMapping[path];
      }

      await this._configStore.saveConfig(this._config);
      await this._serverNetworkProfileRepository.upsertServerNetworkProfile(
        websocketConfig,
        this._config.maxCallLengthSeconds,
      );
      await this._cache.remove(
        getCacheTenantPathMappingKey(websocketConfig.id, path),
        CacheNamespace.TenantPathMapping,
      );
    }

    return websocketConfig;
  }
}
