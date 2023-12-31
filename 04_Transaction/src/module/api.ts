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

import { AbstractModuleApi, AsDataEndpoint, AsMessageEndpoint, CallAction, GetTransactionStatusRequest, GetTransactionStatusRequestSchema, HttpMethod, IMessageConfirmation, Namespace, TransactionEventRequest, TransactionType } from '@citrineos/base';
import { TransactionEventQuerySchema, TransactionEventQuerystring } from "@citrineos/data";
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { ITransactionModuleApi } from './interface';
import { TransactionModule } from './module';

/**
 * Server API for the transaction module.
 */
export class TransactionModuleApi extends AbstractModuleApi<TransactionModule> implements ITransactionModuleApi {

    /**
     * Constructor for the class.
     *
     * @param {TransactionModule} transactionModule - The transaction module.
     * @param {FastifyInstance} server - The server instance.
     * @param {Logger<ILogObj>} [logger] - Optional logger.
     */
    constructor(transactionModule: TransactionModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(transactionModule, server, logger);
    }
    /**
   * Data Endpoint Methods
   */

    @AsDataEndpoint(Namespace.TransactionEventRequest, HttpMethod.Get, TransactionEventQuerySchema)
    getTransactionEventsByStationIdAndTransactionId(request: FastifyRequest<{ Querystring: TransactionEventQuerystring }>): Promise<TransactionEventRequest[]> {
        return this._module.transactionEventRepository.readAllByStationIdAndTransactionId(request.query.stationId, request.query.transactionId);
    }

    @AsDataEndpoint(Namespace.TransactionType, HttpMethod.Get, TransactionEventQuerySchema)
    getTransactionByStationIdAndTransactionId(request: FastifyRequest<{ Querystring: TransactionEventQuerystring }>): Promise<TransactionType | undefined> {
        return this._module.transactionEventRepository.readTransactionByStationIdAndTransactionId(request.query.stationId, request.query.transactionId);
    }

    // TODO: Determine how to implement readAllTransactionsByStationIdAndChargingStates as a GET...
    // TODO: Determine how to implement existsActiveTransactionByIdToken as a GET...

    /**
     * Message Endpoint Methods
     */

    @AsMessageEndpoint(CallAction.GetTransactionStatus, GetTransactionStatusRequestSchema)
    getTransactionStatus(identifier: string, tenantId: string, request: GetTransactionStatusRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.GetTransactionStatus, request, callbackUrl);
    }

    /**
    * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
    *
    * @param {CallAction} input - The input {@link CallAction}.
    * @return {string} - The generated URL path.
    */
    protected _toMessagePath(input: CallAction): string {
        const endpointPrefix = this._module.config.transaction.api.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.transaction.api.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}