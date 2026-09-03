// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { joinRoutePath } from '@base-util/endpoints/paths.js';
import { registerRouteSchema } from '@base-util/endpoints/route-schemas.js';
import {
  type CallAction,
  type EventGroup,
  HttpMethod,
  type OcppRequest,
  type OCPPVersion,
  type SystemConfig,
} from '@citrineos/types';
import type {
  AbstractMessageEndpoint,
  IMessageEndpointMetadata,
} from '@interfaces/api/endpoints/abstract-message-endpoint.js';
import type { BuiltMessageEndpoint } from '@interfaces/api/endpoints/build-message-endpoints.js';
import {
  type IMessageQuerystring,
  IMessageQuerystringSchema,
} from '@interfaces/api/message-querystring.js';
import type { IMessageConfirmation } from '@interfaces/messages/index.js';
import { MessageConfirmationSchema } from '@ocpp/persistence/query-schema.js';
import type {
  FastifyInstance,
  FastifyRequest,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
  RouteOptions,
} from 'fastify';
import { type ILogObj, Logger } from 'tslog';

interface MessageRoute {
  Body: OcppRequest;
  Querystring: IMessageQuerystring & Record<string, unknown>;
}

interface MessageRouteSchemas {
  body: object | null;
  querystring: object | null;
  response: object | null;
}

interface MessageRouteSchemaSources {
  body: object;
  querystring: object;
  response: object;
}

type MessageRouteHandler = (
  request: FastifyRequest<MessageRoute>,
) => Promise<IMessageConfirmation[]>;

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
    route: IMessageEndpointMetadata,
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

    const url = this._toMessagePath(route.eventGroup, route.action, version);
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

    const schemas: MessageRouteSchemaSources = {
      body: bodySchema,
      querystring: querystringSchema,
      response: responseSchema,
    };

    if (this._config.swagger?.exposeMessage) {
      this._registerWithSharedSchemas(url, handler, version, schemas);
      return;
    }

    this._registerWithInlineSchemas(url, handler, schemas);
  }

  private _registerWithSharedSchemas(
    url: string,
    handler: MessageRouteHandler,
    version: OCPPVersion,
    schemas: MessageRouteSchemaSources,
  ): void {
    this._server.register(async (fastifyInstance) => {
      const targets = { scoped: fastifyInstance, root: this._server, logger: this._logger };
      fastifyInstance.route(
        this._routeOptions(url, handler, {
          body: registerRouteSchema(targets, schemas.body, `${version}-`),
          querystring: registerRouteSchema(targets, schemas.querystring),
          response: registerRouteSchema(targets, schemas.response),
        }),
      );
    });
  }

  private _registerWithInlineSchemas(
    url: string,
    handler: MessageRouteHandler,
    schemas: MessageRouteSchemaSources,
  ): void {
    this._server.route(this._routeOptions(url, handler, schemas));
  }

  private _routeOptions(
    url: string,
    handler: MessageRouteHandler,
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

  private _toMessagePath(eventGroup: EventGroup, action: CallAction, version: OCPPVersion): string {
    const endpointVersion = version.replace(/^ocpp/, '');
    const route = action.charAt(0).toLowerCase() + action.slice(1);
    return joinRoutePath('ocpp', endpointVersion, eventGroup, route);
  }
}
