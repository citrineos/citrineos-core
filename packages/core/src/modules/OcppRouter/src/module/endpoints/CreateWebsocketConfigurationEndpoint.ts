// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type BootstrapConfig,
  type ConfigStore,
  type IEndpointDefinition,
  AbstractEndpoint,
  BadRequestError,
} from '@citrineos/base';
import {
  type SystemConfig,
  type WebsocketServerConfig,
  HttpMethod,
  websocketServerSchema,
} from '@citrineos/types';
import { WebsocketRequestSchema } from '@dal/interfaces/index.js';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  config: BootstrapConfig & SystemConfig;
  configStore: ConfigStore;
}

type Route = { Body: WebsocketServerConfig };

export class CreateWebsocketConfigurationEndpoint extends AbstractEndpoint<Route> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Post,
    path: '/websocket',
    bodySchema: WebsocketRequestSchema,
  };

  private readonly _config: BootstrapConfig & SystemConfig;
  private readonly _configStore: ConfigStore;

  constructor({ logger, config, configStore }: Deps) {
    super(logger);
    this._config = config;
    this._configStore = configStore;
  }

  async handle(request: FastifyRequest<Route>): Promise<WebsocketServerConfig> {
    const server = websocketServerSchema.parse(request.body);

    const existingConfig = this._config.util.networkConnection.websocketServers.find(
      (ws) => ws.id === server.id,
    );

    if (existingConfig) {
      throw new BadRequestError(`Websocket configuration with id ${server.id} already exists.`);
    }

    this._config.util.networkConnection.websocketServers.push(server);
    await this._configStore.saveConfig(this._config);
    return server;
  }
}
