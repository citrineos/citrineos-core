// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import 'reflect-metadata';
import { ILogObj, Logger } from 'tslog';
import {
  HttpMethod,
  IDataEndpointDefinition,
  IMessageEndpointDefinition,
  METADATA_DATA_ENDPOINTS,
  METADATA_MESSAGE_ENDPOINTS,
} from '.';
import { OcppRequest, SystemConfig } from '../..';
import { Namespace } from '../../ocpp/persistence';
import { CallAction } from '../../ocpp/rpc/message';
import { IMessageConfirmation } from '../messages';
import { IModule } from '../modules';
import {
  IMessageQuerystringSchema,
} from './MessageQuerystring';
import { IModuleApi } from './ModuleApi';
import { AuthorizationSecurity } from './AuthorizationSecurity';

/**
 * Abstract module api class implementation.
 */
export abstract class AbstractModuleApi<T extends IModule>
  implements IModuleApi {
  protected readonly _server: FastifyInstance;
  protected readonly _module: T;
  protected readonly _logger: Logger<ILogObj>;

  constructor(module: T, server: FastifyInstance, logger?: Logger<ILogObj>) {
    this._module = module;
    this._server = server;

    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    this._init(this._module);
  }

  /**
   * Initializes the API for the given module.
   *
   * @param {T} module - The module to initialize the API for.
   */
  protected _init(module: T): void {
    (
      Reflect.getMetadata(
        METADATA_MESSAGE_ENDPOINTS,
        this.constructor,
      ) as Array<IMessageEndpointDefinition>
    )?.forEach((expose) => {
      this._addMessageRoute.call(
        this,
        expose.action,
        expose.method,
        expose.bodySchema,
        expose.optionalQuerystrings,
      );
    });
    (
      Reflect.getMetadata(
        METADATA_DATA_ENDPOINTS,
        this.constructor,
      ) as Array<IDataEndpointDefinition>
    )?.forEach((expose) => {
      this._addDataRoute.call(
        this,
        expose.namespace,
        expose.method,
        expose.httpMethod,
        expose.querySchema,
        expose.paramSchema,
        expose.headerSchema,
        expose.bodySchema,
        expose.responseSchema,
        expose.tags,
        expose.description,
        expose.security,
      );
    });

    // Add API routes for getting and setting SystemConfig
    this._addDataRoute.call(
      this,
      Namespace.SystemConfig,
      () => new Promise((resolve) => resolve(module.config)),
      HttpMethod.Get,
    );
    this._addDataRoute.call(
      this,
      Namespace.SystemConfig,
      (request: FastifyRequest<{ Body: SystemConfig }>) =>
        new Promise<void>((resolve) => {
          module.config = request.body;
          resolve();
        }),
      HttpMethod.Put,
    );
  }

  /**
   * Add a message route to the server.
   *
   * @param {CallAction} action - The action to be called.
   * @param {Function} method - The method to be executed.
   * @param {object} bodySchema - The schema for the route.
   * @param {Record<string, any>} optionalQuerystrings - Optional querystrings for the route.
   * @return {void}
   */
  protected _addMessageRoute(
    action: CallAction,
    method: (...args: any[]) => any,
    bodySchema: object,
    optionalQuerystrings?: Record<string, any>
  ): void {
    this._logger.debug(
      `Adding message route for ${action}`,
      this._toMessagePath(action),
    );

    /**
     * Executes the handler function for the given request.
     *
     * @param {FastifyRequest<{ Body: OcppRequest, Querystring: IMessageQuerystring }>} request - The request object containing the body and querystring.
     * @return {Promise<IMessageConfirmation>} The promise that resolves to the message confirmation.
     */
    const _handler = async (
      request: FastifyRequest<{
        Body: OcppRequest;
        Querystring: Record<string, any>;
      }>,
    ): Promise<IMessageConfirmation> => {
      const { identifier, tenantId, callbackUrl, ...extraQueries } = request.query;
      return method.call(
        this,
        identifier,
        tenantId,
        request.body,
        callbackUrl,
        Object.keys(extraQueries).length > 0 ? extraQueries : undefined,
      );
    }

    const mergedQuerySchema = {
      ...IMessageQuerystringSchema,
      properties: {
        ...IMessageQuerystringSchema.properties,
        ...(optionalQuerystrings || {}),
      },
    };

    const _opts = {
      schema: {
        body: bodySchema,
        querystring: mergedQuerySchema,
      } as const,
    };

    if (this._module.config.util.swagger?.exposeMessage) {
      this._server.register(async (fastifyInstance) => {
        this.registerSchemaForOpts(fastifyInstance, _opts);
        fastifyInstance.post(this._toMessagePath(action), _opts, _handler);
      });
    } else {
      this._server.post(this._toMessagePath(action), _opts, _handler);
    }
  }

  /**
   * Add a message route to the server.
   *
   * @param {Namespace} namespace - The entity type.
   * @param {Function} method - The method to be executed.
   * @param {object} schema - The schema for the entity.
   * @return {void}
   */
  protected _addDataRoute(
    namespace: Namespace,
    method: (...args: any[]) => any,
    httpMethod: HttpMethod,
    querySchema?: object,
    paramSchema?: object,
    headerSchema?: object,
    bodySchema?: object,
    responseSchema?: object,
    tags?: string[],
    description?: string,
    security?: object[],
  ): void {
    this._logger.debug(
      `Adding data route for ${namespace}`,
      this._toDataPath(namespace),
      httpMethod,
    );
    const schema: Record<string, any> = {};
    if (querySchema) {
      schema['querystring'] = querySchema;
    }
    if (bodySchema) {
      schema['body'] = bodySchema;
    }
    if (paramSchema) {
      schema['params'] = paramSchema;
    }
    if (headerSchema) {
      schema['headers'] = headerSchema;
    }
    if (responseSchema) {
      schema['response'] = {
        200: responseSchema,
      };
    }
    if (tags) {
      schema['tags'] = tags;
    }
    if (description) {
      schema['description'] = description;
    }
    if (security) {
      schema['security'] = security;
    }

    /**
     * Handles the request and returns a Promise resolving to an object.
     *
     * @param {FastifyRequest<{ Body: object, Querystring: object }>} request - the request object
     * @param {FastifyReply} reply - the reply object
     * @return {Promise<any>} - a Promise resolving to an object
     */
    const _handler = async (
      request: FastifyRequest<{
        Body: object;
        Querystring: object;
      }>,
      reply: FastifyReply,
    ): Promise<unknown> =>
      (
        method.call(this, request, reply) as Promise<
          undefined | string | object
        >
      ).catch((err) => {
        // TODO: figure out better error codes & messages
        this._logger.error('Error in handling data route', err);
        const statusCode = err.statusCode ? err.statusCode : 500;
        reply.status(statusCode).send(err);
      });

    const _opts: any = {
      method: httpMethod,
      url: this._toDataPath(namespace),
      schema: schema,
      handler: _handler,
    };

    if (
      !!schema &&
      !!schema.headers &&
      !!schema.headers.properties &&
      !!schema.headers.properties.Authorization
    ) {
      _opts['preHandler'] = (this._server as unknown as any).auth([
        (this._server as unknown as any).authorization,
      ]);
      if (!_opts['security']) {
        _opts.schema['security'] = [AuthorizationSecurity];
      } else {
        _opts.schema['security'].push(AuthorizationSecurity);
      }
    }

    if (this._module.config.util.swagger?.exposeData) {
      this._server.register(async (fastifyInstance) => {
        this.registerSchemaForOpts(fastifyInstance, _opts);
        fastifyInstance.route<{ Body: object; Querystring: object }>(_opts);
      });
    } else {
      this._server.route<{ Body: object; Querystring: object }>(_opts);
    }
  }

  private registerSchemaForOpts = (
    fastifyInstance: FastifyInstance,
    _opts: any,
  ) => {
    if (_opts.schema['querystring']) {
      _opts.schema['querystring'] = this.registerSchema(
        fastifyInstance,
        _opts.schema['querystring'],
      );
    }
    if (_opts.schema['body']) {
      _opts.schema['body'] = this.registerSchema(
        fastifyInstance,
        _opts.schema['body'],
      );
    }
    if (_opts.schema['params']) {
      _opts.schema['params'] = this.registerSchema(
        fastifyInstance,
        _opts.schema['params'],
      );
    }
    if (_opts.schema['headers']) {
      _opts.schema['headers'] = this.registerSchema(
        fastifyInstance,
        _opts.schema['headers'],
      );
    }
    if (_opts.schema['response']) {
      _opts.schema['response'] = {
        200: this.registerSchema(
          fastifyInstance,
          _opts.schema['response'][200],
        ),
      };
    }
  };

  protected registerSchema = (
    fastifyInstance: FastifyInstance,
    schema: any,
  ): object | null => {
    try {
      let id = schema['$id'];
      if (!id) {
        this._logger.error('Could not register schema because no ID', schema);
      }
      const schemaCopy = this.removeUnknownKeys(schema);
      fastifyInstance.addSchema(schemaCopy);
      return {
        $ref: `${id}`,
      };
    } catch (e: any) {
      // ignore already declared
      if (e.code !== 'FST_ERR_SCH_ALREADY_PRESENT') {
        this._logger.error('Could not register schema', e, schema);
      }
      return null;
    }
  };

  // TODO: for performance reasons can these unknown keys be removed directly from schemas?
  private removeUnknownKeys = (schema: any): any => {
    // Create a deep copy of the schema
    const schemaCopy = structuredClone(schema); // Use structuredClone for a true deep copy

    const cleanSchema = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      // Remove specific unknown keys
      for (let unknownKey of ['comment', 'javaType', 'tsEnumNames']) {
        if (unknownKey in obj) {
          delete obj[unknownKey];
        }
      }

      // Remove `additionalItems` if `items` is not an array
      if (
        'items' in obj &&
        !Array.isArray(obj.items) &&
        'additionalItems' in obj
      ) {
        delete obj.additionalItems;
      }

      // Remove `additionalProperties` if `type` is not "object"
      if ('additionalProperties' in obj && obj.type !== 'object') {
        delete obj.additionalProperties;
      }

      // Recursively process nested objects
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          cleanSchema(obj[key]);
        }
      }
    };

    // Clean the copied schema
    cleanSchema(schemaCopy);

    return schemaCopy;
  };

  /**
   * Convert a {@link CallAction} to a normed lowercase URL path.
   *
   * @param {CallAction} input - The {@link CallAction} to convert to a URL path.
   * @returns {string} - String representation of URL path.
   */
  protected _toMessagePath(input: CallAction, prefix?: string): string {
    const endpointPrefix = prefix || '';
    return `/ocpp${!endpointPrefix.startsWith('/') ? '/' : ''}${endpointPrefix}${!endpointPrefix.endsWith('/') ? '/' : ''}${input.charAt(0).toLowerCase() + input.slice(1)}`;
  }

  /**
   * Convert a {@link Namespace} to a normed lowercase URL path.
   *
   * @param {Namespace} input - The {@link Namespace} to convert to a URL path.
   * @returns {string} - String representation of URL path.
   */
  protected _toDataPath(input: Namespace, prefix?: string): string {
    const endpointPrefix = prefix || '';
    return `/data${!endpointPrefix.startsWith('/') ? '/' : ''}${endpointPrefix}${!endpointPrefix.endsWith('/') ? '/' : ''}${input.charAt(0).toLowerCase() + input.slice(1)}`;
  }
}
