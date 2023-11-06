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

import { AbstractModuleApi, AsDataEndpoint, AsMessageEndpoint, AuthorizationData, AuthorizationDataSchema, CallAction, ClearCacheRequest, ClearCacheRequestSchema, HttpMethod, IMessageConfirmation, InstallCertificateRequest, InstallCertificateRequestSchema, Namespace, RequestStartTransactionRequest, RequestStartTransactionRequestSchema, RequestStopTransactionRequest, RequestStopTransactionRequestSchema } from '@citrineos/base';
import { AuthorizationQuerySchema, AuthorizationQuerystring, AuthorizationRestrictions, AuthorizationRestrictionsSchema, ChargingStationKeyQuerySchema } from '@citrineos/data';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IAuthorizationModuleApi } from './interface';
import { AuthorizationModule } from './module';

/**
 * Server API for the provisioning component.
 */
export class AuthorizationModuleApi extends AbstractModuleApi<AuthorizationModule> implements IAuthorizationModuleApi {

    /**
     * Constructs a new instance of the class.
     *
     * @param {AuthorizationModule} authorizationModule - The authorization module.
     * @param {FastifyInstance} server - The Fastify server instance.
     * @param {Logger<ILogObj>} [logger] - The logger for logging.
     */
    constructor(authorizationModule: AuthorizationModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(authorizationModule, server, logger);
    }

    /**
     * Data Endpoint Methods
     */

    @AsDataEndpoint(Namespace.AuthorizationData, HttpMethod.Put, AuthorizationQuerySchema, AuthorizationDataSchema)
    putAuthorization(request: FastifyRequest<{ Body: AuthorizationData, Querystring: AuthorizationQuerystring }>): Promise<AuthorizationData | undefined> {
        return this._module.authorizeRepository.createOrUpdateByQuery(request.body, request.query);
    }

    @AsDataEndpoint(Namespace.AuthorizationRestrictions, HttpMethod.Put, AuthorizationQuerySchema, AuthorizationRestrictionsSchema)
    putAuthorizationRestrictions(request: FastifyRequest<{ Body: AuthorizationRestrictions, Querystring: AuthorizationQuerystring }>): Promise<AuthorizationData | undefined> {
        return this._module.authorizeRepository.updateRestrictionsByQuery(request.body, request.query);
    }

    @AsDataEndpoint(Namespace.AuthorizationData, HttpMethod.Get, AuthorizationQuerySchema)
    getAuthorization(request: FastifyRequest<{ Querystring: AuthorizationQuerystring }>): Promise<AuthorizationData | undefined> {
        return this._module.authorizeRepository.readByQuery(request.query);
    }

    @AsDataEndpoint(Namespace.AuthorizationData, HttpMethod.Delete, ChargingStationKeyQuerySchema)
    deleteAuthorization(request: FastifyRequest<{ Querystring: AuthorizationQuerystring }>): Promise<string> {
        return this._module.authorizeRepository.deleteAllByQuery(request.query)
            .then(deletedCount => deletedCount.toString() + " rows successfully deleted from " + Namespace.AuthorizationData);
    }

    /**
     * Message Endpoint Methods
     */

    @AsMessageEndpoint(CallAction.RequestStartTransaction, RequestStartTransactionRequestSchema)
    requestStartTransaction(identifier: string, tenantId: string, request: RequestStartTransactionRequest): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.RequestStartTransaction, request);
    }

    @AsMessageEndpoint(CallAction.RequestStopTransaction, RequestStopTransactionRequestSchema)
    requestStopTransaction(identifier: string, tenantId: string, request: RequestStopTransactionRequest): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.RequestStopTransaction, request);
    }

    @AsMessageEndpoint(CallAction.ClearCache, ClearCacheRequestSchema)
    clearCache(identifier: string, tenantId: string, request: ClearCacheRequest): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.ClearCache, request);
    }

    @AsMessageEndpoint(CallAction.InstallCertificate, InstallCertificateRequestSchema)
    installCertificate(identifier: string, tenantId: string, request: InstallCertificateRequest): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.InstallCertificate, request);
    }

    /**
    * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
    *
    * @param {CallAction} input - The input {@link CallAction}.
    * @return {string} - The generated URL path.
    */
    protected _toMessagePath(input: CallAction): string {
        const endpointPrefix = this._module.config.authorization.api.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.authorization.api.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}