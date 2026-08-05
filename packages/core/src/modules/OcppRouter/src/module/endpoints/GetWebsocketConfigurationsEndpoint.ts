// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type BootstrapConfig,
  type IEndpointDefinition,
  AbstractEndpoint,
  NotFoundError,
} from '@citrineos/base';
import { type SystemConfig, type WebsocketServerConfig, HttpMethod } from '@citrineos/types';
import type { WebsocketGetQuerystring } from '@dal/interfaces/index.js';
import { WebsocketGetQuerySchema } from '@dal/interfaces/index.js';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  config: BootstrapConfig & SystemConfig;
}

type Route = { Querystring: WebsocketGetQuerystring };

export class GetWebsocketConfigurationsEndpoint extends AbstractEndpoint<Route> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Get,
    path: '/websocket',
    querySchema: WebsocketGetQuerySchema,
  };

  private readonly _config: BootstrapConfig & SystemConfig;

  constructor({ logger, config }: Deps) {
    super(logger);
    this._config = config;
  }

  async handle(
    request: FastifyRequest<Route>,
  ): Promise<WebsocketServerConfig[] | WebsocketServerConfig> {
    if (request.query.id) {
      const websocketConfig = this._config.util.networkConnection.websocketServers.find(
        (ws) => ws.id === request.query.id,
      );

      if (!websocketConfig) {
        throw new NotFoundError(
          `Could not find websocket configuration with id ${request.query.id}`,
        );
      }
      return websocketConfig;
    }
    return this._config.util.networkConnection.websocketServers;
  }
}
