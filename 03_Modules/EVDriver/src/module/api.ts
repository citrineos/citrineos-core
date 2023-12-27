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

import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IEVDriverModuleApi } from './interface';
import { EVDriverModule } from './module';
import { AbstractModuleApi, AsDataEndpoint, Namespace, HttpMethod, AsMessageEndpoint, CallAction, RequestStartTransactionRequestSchema, RequestStartTransactionRequest, IMessageConfirmation, RequestStopTransactionRequestSchema, RequestStopTransactionRequest, UnlockConnectorRequestSchema, UnlockConnectorRequest, ClearCacheRequestSchema, ClearCacheRequest, SendLocalListRequestSchema, SendLocalListRequest, GetLocalListVersionRequestSchema, GetLocalListVersionRequest, InstallCertificateRequestSchema, InstallCertificateRequest, GetInstalledCertificateIdsRequestSchema, GetInstalledCertificateIdsRequest, DeleteCertificateRequestSchema, DeleteCertificateRequest, AuthorizationData, AuthorizationDataSchema } from '@citrineos/base';
import { AuthorizationQuerySchema, AuthorizationQuerystring, AuthorizationRestrictions, AuthorizationRestrictionsSchema, ChargingStationKeyQuerySchema } from '@citrineos/data';

/**
 * Server API for the provisioning component.
 */
export class EVDriverModuleApi extends AbstractModuleApi<EVDriverModule> implements IEVDriverModuleApi {

    /**
     * Constructs a new instance of the class.
     *
     * @param {EVDriverModule} EVDriverModule - The EVDriver module.
     * @param {FastifyInstance} server - The Fastify server instance.
     * @param {Logger<ILogObj>} [logger] - The logger for logging.
     */
    constructor(EVDriverModule: EVDriverModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(EVDriverModule, server, logger);
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
    requestStartTransaction(identifier: string, tenantId: string, request: RequestStartTransactionRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.RequestStartTransaction, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.RequestStopTransaction, RequestStopTransactionRequestSchema)
    requestStopTransaction(identifier: string, tenantId: string, request: RequestStopTransactionRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.RequestStopTransaction, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.UnlockConnector, UnlockConnectorRequestSchema)
    unlockConnector(identifier: string, tenantId: string, request: UnlockConnectorRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.UnlockConnector, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.ClearCache, ClearCacheRequestSchema)
    clearCache(identifier: string, tenantId: string, request: ClearCacheRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.ClearCache, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.SendLocalList, SendLocalListRequestSchema)
    sendLocalList(identifier: string, tenantId: string, request: SendLocalListRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.SendLocalList, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.GetLocalListVersion, GetLocalListVersionRequestSchema)
    getLocalListVersion(identifier: string, tenantId: string, request: GetLocalListVersionRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.GetLocalListVersion, request, callbackUrl);
    }

    /**
    * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
    *
    * @param {CallAction} input - The input {@link CallAction}.
    * @return {string} - The generated URL path.
    */
    protected _toMessagePath(input: CallAction): string {
        const endpointPrefix = this._module.config.modules.evdriver?.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.modules.evdriver?.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}