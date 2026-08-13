// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { type ILogObj, Logger } from 'tslog';
import type { BuiltEndpoint } from '@interfaces/api/endpoints/buildEndpoints.js';
import type { ICommandEndpointMetadata } from '@interfaces/api/endpoints/EndpointMetadata.js';
import { joinRoutePath } from '@base-util/endpoints/paths.js';
import { removeUnknownSchemaKeys } from '@base-util/endpoints/routeSchemas.js';

export abstract class AbstractEndpointApi {
  protected readonly _server: FastifyInstance;
  protected readonly _logger: Logger<ILogObj>;
  private readonly _prefix: string;

  constructor(
    server: FastifyInstance,
    prefix: string,
    endpoints: BuiltEndpoint[],
    logger?: Logger<ILogObj>,
  ) {
    this._server = server;
    this._prefix = prefix;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    for (const { route, endpoint } of endpoints) {
      this._addRoute(route, endpoint);
    }
  }

  private _addRoute(route: ICommandEndpointMetadata, endpoint: BuiltEndpoint['endpoint']): void {
    const url = joinRoutePath(this._prefix, route.path);
    this._logger.debug(`Adding ${route.method} route ${url}`);

    this._server.route({
      method: route.method,
      url,
      schema: this._toRouteSchema(route),
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          return await endpoint.handle(request, reply);
        } catch (error) {
          this._logger.error(`Error handling ${route.method} ${url}`, error);
          throw error;
        }
      },
    });
  }

  private _toRouteSchema(route: ICommandEndpointMetadata): Record<string, unknown> {
    const schema: Record<string, unknown> = {};
    if (route.querySchema) {
      schema.querystring = this._routeSchema(route.querySchema);
    }
    if (route.bodySchema) {
      schema.body = this._routeSchema(route.bodySchema);
    }
    if (route.responseSchema) {
      schema.response = { 200: this._routeSchema(route.responseSchema) };
    }
    if (route.tags) {
      schema.tags = route.tags;
    }
    if (route.description) {
      schema.description = route.description;
    }
    return schema;
  }

  private _routeSchema(schema: object): object {
    const { $id: _unusedId, ...inlined } = removeUnknownSchemaKeys(schema);
    return inlined;
  }
}
