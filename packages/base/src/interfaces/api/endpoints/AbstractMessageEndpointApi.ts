// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  FastifyInstance,
  FastifyRequest,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
  RouteOptions,
} from 'fastify';
import { type ILogObj, Logger } from 'tslog';
import {
  HttpMethod,
  type OcppRequest,
  type OCPPVersion,
  type SystemConfig,
} from '@citrineos/types';
import type { BuiltMessageEndpoint } from '@interfaces/api/endpoints/buildMessageEndpoints.js';
import type {
  AbstractMessageEndpoint,
  IMessageEndpointDeclaration,
} from '@interfaces/api/endpoints/AbstractMessageEndpoint.js';
import { registerRouteSchema } from '@interfaces/api/endpoints/routeSchemas.js';
import {
  type IMessageQuerystring,
  IMessageQuerystringSchema,
} from '@interfaces/api/MessageQuerystring.js';
import { MessageConfirmationSchema } from '@ocpp/persistence/querySchema.js';
import type { IMessageConfirmation } from '@interfaces/messages/index.js';

interface MessageRoute {
  Body: OcppRequest;
  Querystring: IMessageQuerystring & Record<string, unknown>;
}

interface MessageRouteSchemas {
  body: object | null;
  querystring: object | null;
  response: object | null;
}

export abstract class AbstractMessageEndpointApi {
  protected readonly _server: FastifyInstance;
  protected readonly _config: SystemConfig;
  protected readonly _logger: Logger<ILogObj>;

  constructor(
    server: FastifyInstance,
    config: SystemConfig,
    endpoints: BuiltMessageEndpoint[],
    logger?: Logger<ILogObj>,
  ) {
    this._server = server;
    this._config = config;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    for (const { route, endpoint } of endpoints) {
      for (const version of route.protocols) {
        this._addMessageRoute(route, endpoint, version);
      }
    }
  }

  private _addMessageRoute(
    route: IMessageEndpointDeclaration,
    endpoint: AbstractMessageEndpoint,
    version: OCPPVersion,
  ): void {
    const bodySchema = route.bodySchema(version);
    if (!bodySchema) {
      this._logger.debug(
        `Skipping message route for ${route.action} — schema not available for ${version}`,
      );
      return;
    }

    const url = this._toMessagePath(route, version);
    this._logger.debug(`Adding message route for ${route.action}`, url);

    const querystringSchema = {
      ...IMessageQuerystringSchema,
      properties: {
        ...IMessageQuerystringSchema.properties,
        ...(route.optionalQuerystrings ?? {}),
      },
    };
    const responseSchema = {
      $id: 'MessageConfirmationSchemaArray',
      type: 'array',
      items: MessageConfirmationSchema,
    };

    const handler = async (
      request: FastifyRequest<MessageRoute>,
    ): Promise<IMessageConfirmation[]> => {
      const { identifier, tenantId, callbackUrl, ...extraQueries } = request.query;
      const identifiers = Array.isArray(identifier) ? identifier : [identifier];

      return endpoint.handle(
        identifiers,
        request.body,
        callbackUrl,
        tenantId,
        version,
        Object.keys(extraQueries).length > 0 ? extraQueries : undefined,
      );
    };

    if (this._config.util.swagger?.exposeMessage) {
      this._server.register(async (fastifyInstance) => {
        const targets = { scoped: fastifyInstance, root: this._server, logger: this._logger };
        fastifyInstance.route(
          this._routeOptions(url, handler, {
            body: registerRouteSchema(targets, bodySchema, `${version}-`),
            querystring: registerRouteSchema(targets, querystringSchema),
            response: registerRouteSchema(targets, responseSchema),
          }),
        );
      });
    } else {
      this._server.route(
        this._routeOptions(url, handler, {
          body: bodySchema,
          querystring: querystringSchema,
          response: responseSchema,
        }),
      );
    }
  }

  private _routeOptions(
    url: string,
    handler: (request: FastifyRequest<MessageRoute>) => Promise<IMessageConfirmation[]>,
    schemas: MessageRouteSchemas,
  ): RouteOptions<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    MessageRoute
  > {
    return {
      method: HttpMethod.Post,
      url,
      handler,
      schema: {
        body: schemas.body,
        querystring: schemas.querystring,
        response: { 200: schemas.response },
      },
    };
  }

  private _toMessagePath(route: IMessageEndpointDeclaration, version: OCPPVersion): string {
    const endpointPrefix =
      this._config.modules[route.endpointPrefixConfigKey]?.endpointPrefix ?? '';
    const endpointVersion = version.replace(/^ocpp/, '');
    const action = route.action.charAt(0).toLowerCase() + route.action.slice(1);
    return `/ocpp/${endpointVersion}${!endpointPrefix.startsWith('/') ? '/' : ''}${endpointPrefix}${!endpointPrefix.endsWith('/') ? '/' : ''}${action}`;
  }
}
