// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type IEndpointDefinition,
  type INetworkConnection,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { ConnectionDeleteQuerystring } from '@dal/interfaces/index.js';
import { ConnectionDeleteQuerySchema } from '@dal/interfaces/index.js';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  networkConnection: INetworkConnection;
}

type Route = { Querystring: ConnectionDeleteQuerystring };

export class DeleteWebsocketConnectionEndpoint extends AbstractEndpoint<Route> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Delete,
    path: '/connection',
    querySchema: ConnectionDeleteQuerySchema,
  };

  private readonly _networkConnection: INetworkConnection;

  constructor({ logger, networkConnection }: Deps) {
    super(logger);
    this._networkConnection = networkConnection;
  }

  async handle(request: FastifyRequest<Route>): Promise<void> {
    await this._networkConnection.disconnect(
      request.query.tenantId,
      request.query.ocppConnectionName,
    );
  }
}
