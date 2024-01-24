// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { TransactionEventQuerySchema, TransactionEventQuerystring } from "@citrineos/data";
import { ILogObj, Logger } from 'tslog';
import { ITransactionsModuleApi } from './interface';
import { TransactionsModule } from './module';
import { AbstractModuleApi, AsDataEndpoint, Namespace, HttpMethod, TransactionEventRequest, TransactionType, AsMessageEndpoint, CallAction, GetTransactionStatusRequestSchema, GetTransactionStatusRequest, IMessageConfirmation } from "@citrineos/base";
import { FastifyInstance, FastifyRequest } from "fastify";

/**
 * Server API for the transaction module.
 */
export class TransactionsModuleApi extends AbstractModuleApi<TransactionsModule> implements ITransactionsModuleApi {

    /**
     * Constructor for the class.
     *
     * @param {TransactionModule} transactionModule - The transaction module.
     * @param {FastifyInstance} server - The server instance.
     * @param {Logger<ILogObj>} [logger] - Optional logger.
     */
    constructor(transactionModule: TransactionsModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(transactionModule, server, logger);
    }

    /**
     * Message Endpoint Methods
     */

    @AsMessageEndpoint(CallAction.GetTransactionStatus, GetTransactionStatusRequestSchema)
    getTransactionStatus(identifier: string, tenantId: string, request: GetTransactionStatusRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.GetTransactionStatus, request, callbackUrl);
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
    * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
    *
    * @param {CallAction} input - The input {@link CallAction}.
    * @return {string} - The generated URL path.
    */
    protected _toMessagePath(input: CallAction): string {
        const endpointPrefix = this._module.config.modules.transactions.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.modules.transactions.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}