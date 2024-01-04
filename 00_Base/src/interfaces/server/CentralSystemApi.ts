/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Logger, ILogObj } from "tslog";
import { METADATA_ADMIN_ENDPOINTS } from ".";
import { HttpMethod } from "../api";
import { IAdminEndpointDefinition } from "./AdminEndpointDefinition";
import { AbstractCentralSystem } from "./CentralSystem";
import { EventGroup } from "../messages";




/**
 * Abstract module api class implementation.
 */
export abstract class AbstractCentralSystemApi {

    protected readonly _server: FastifyInstance;
    protected readonly _centralSystem: AbstractCentralSystem;
    protected readonly _logger: Logger<ILogObj>;

    constructor(centralSystem: AbstractCentralSystem, server: FastifyInstance, logger?: Logger<ILogObj>) {
        this._centralSystem = centralSystem;
        this._server = server;

        this._logger = logger ? logger.getSubLogger({ name: this.constructor.name }) : new Logger<ILogObj>({ name: this.constructor.name });
        this._init();
    }

    /**
     * Initializes the Central System's API.
     *
     */
    protected _init(): void {
        (Reflect.getMetadata(METADATA_ADMIN_ENDPOINTS, this.constructor) as Array<IAdminEndpointDefinition>)?.forEach((expose) => {
            this._addAdminRoute.call(this, expose.eventGroup, expose.method, expose.httpMethod, expose.querySchema, expose.bodySchema);
        });
    }

    /**
     * Add a message route to the server.
     *
     * @param {EventGroup} eventGroup - The target type.
     * @param {Function} method - The method to be executed.
     * @param {object} schema - The schema for the entity.
     * @return {void}
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    protected _addAdminRoute(eventGroup: EventGroup, method: Function, httpMethod: HttpMethod, querySchema?: object, bodySchema?: object): void {
        this._logger.debug(`Adding Admin route for ${eventGroup}`, this._toAdminPath(eventGroup), httpMethod);
        const schema: Record<string, object> = {};
        if (querySchema) {
            schema["querystring"] = querySchema;
        }
        if (bodySchema) {
            schema["body"] = bodySchema;
        }

        /**
         * Handles the request and returns a Promise resolving to an object.
         *
         * @param {FastifyRequest<{ Body: object, Querystring: object }>} request - the request object
         * @param {FastifyReply} reply - the reply object
         * @return {Promise<any>} - a Promise resolving to an object
         */
        const _handler = async (request: FastifyRequest<{ Body: object, Querystring: object }>, reply: FastifyReply): Promise<unknown> => {
            return (method.call(this, request, reply) as Promise<undefined | string | object>).catch(err => {
                // TODO: figure out better error codes & messages
                this._logger.error("Error in handling Admin route", err);
                reply.status(500).send(err);
            });
        };

        const _opts = {
            method: httpMethod,
            url: this._toAdminPath(eventGroup),
            schema: schema,
            handler: _handler
        };

        if (this._centralSystem.config.server.swagger?.exposeAdmin) {
            this._server.register(async (fastifyInstance) => {
                fastifyInstance.route<{ Body: object, Querystring: object }>(_opts);
            });
        } else {
            this._server.route<{ Body: object, Querystring: object }>(_opts);
        }
    }

    /**
     * Convert a {@link EventGroup} to a normed lowercase URL path.
     * 
     * @param {EventGroup} input - The {@link EventGroup} to convert to a URL path.
     * @returns {string} - String representation of URL path.
     */
    protected _toAdminPath(input: EventGroup, prefix?: string): string {
        const endpointPrefix = prefix || "";
        return `/admin${!endpointPrefix.startsWith("/") ? "/" : ""}${endpointPrefix}${!endpointPrefix.endsWith("/") ? "/" : ""}${input.charAt(0).toLowerCase() + input.slice(1)}`;
    }
}