// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type BootstrapConfig,
  type ConfigStore,
  type IEndpointDefinition,
  AbstractEndpoint,
} from '@citrineos/base';
import { type SystemConfig, HttpMethod } from '@citrineos/types';
import type { WebsocketDeleteQuerystring } from '@dal/interfaces/index.js';
import { WebsocketDeleteQuerySchema } from '@dal/interfaces/index.js';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  config: BootstrapConfig & SystemConfig;
  configStore: ConfigStore;
}

type Route = { Querystring: WebsocketDeleteQuerystring };

export class DeleteWebsocketConfigurationEndpoint extends AbstractEndpoint<Route> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Delete,
    path: '/websocket',
    querySchema: WebsocketDeleteQuerySchema,
  };

  private readonly _config: BootstrapConfig & SystemConfig;
  private readonly _configStore: ConfigStore;

  constructor({ logger, config, configStore }: Deps) {
    super(logger);
    this._config = config;
    this._configStore = configStore;
  }

  async handle(request: FastifyRequest<Route>): Promise<void> {
    const websocketServers = this._config.util.networkConnection.websocketServers;
    const existingConfigIndex = websocketServers.findIndex((ws) => ws.id === request.query.id);

    if (existingConfigIndex !== -1) {
      websocketServers.splice(existingConfigIndex, 1);
      await this._configStore.saveConfig(this._config);
    }
  }
}
