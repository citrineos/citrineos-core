// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  type INetworkConnection,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { TlsReloadQueryString } from '@citrineos/dal';
import { TlsReloadQuerySchema } from '@citrineos/dal';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  networkConnection: INetworkConnection;
}

type Route = { Querystring: TlsReloadQueryString };

export class ReloadTlsCertificatesEndpoint extends AbstractEndpoint<Route> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Post,
    path: '/tlsReload',
    querySchema: TlsReloadQuerySchema,
  };

  private readonly _networkConnection: INetworkConnection;

  constructor({ logger, networkConnection }: Deps) {
    super(logger);
    this._networkConnection = networkConnection;
  }

  async handle(request: FastifyRequest<Route>): Promise<void> {
    if (!this._networkConnection.reloadTlsCertificates) {
      throw new Error('Tls certificate reloading is not implemented');
    }
    await this._networkConnection.reloadTlsCertificates(request.query.serverId);
  }
}
