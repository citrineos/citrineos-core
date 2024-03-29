// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AbstractModuleApi, AsDataEndpoint, CallAction, HttpMethod, MessageOrigin, Namespace } from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IAdminApi } from './interface';
import { MessageRouterImpl } from './router';
import { ChargingStationKeyQuerystring, ModelKeyQuerystring } from '@citrineos/data';
import { Subscription } from '@citrineos/data/lib/layers/sequelize';

/**
 * Admin API for the OcppRouter.
 */
export class AdminApi extends AbstractModuleApi<MessageRouterImpl> implements IAdminApi {

    /**
     * Constructs a new instance of the class.
     *
     * @param {MessageRouterImpl} ocppRouter - The OcppRouter module.
     * @param {FastifyInstance} server - The Fastify server instance.
     * @param {Logger<ILogObj>} [logger] - The logger instance.
     */
    constructor(ocppRouter: MessageRouterImpl, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(ocppRouter, server, logger);
    }

    /**
     * Data endpoints
     */

    /**
     * Creates a {@link Subscription}.
     * Will always create a new entity and return its id.
     *
     * @param {FastifyRequest<{ Body: Subscription }>} request - The request object, containing the body which is parsed as a {@link Subscription}.
     * @return {Promise<number>} The id of the created subscription.
     */
    @AsDataEndpoint(Namespace.Subscription, HttpMethod.Post)
    async putSubscription(request: FastifyRequest<{ Body: Subscription }>): Promise<number> {
        return this._module.subscriptionRepository.create(request.body as Subscription).then((subscription) => subscription?.id);
    }

    @AsDataEndpoint(Namespace.Subscription, HttpMethod.Get)
    async getSubscriptionsByChargingStation(request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>): Promise<Subscription[]> {
        return this._module.subscriptionRepository.readAllByStationId(request.query.stationId);
    }

    @AsDataEndpoint(Namespace.Subscription, HttpMethod.Delete)
    async deleteSubscriptionById(request: FastifyRequest<{ Querystring: ModelKeyQuerystring }>): Promise<boolean> {
        return this._module.subscriptionRepository.deleteByKey(request.query.id.toString()).then(() => true);
    }

    /**
    * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
    *
    * @param {CallAction} input - The input {@link CallAction}.
    * @return {string} - The generated URL path.
    */
    protected _toMessagePath(input: CallAction): string {
        const endpointPrefix = '/ocpprouter';
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = '/ocpprouter';
        return super._toDataPath(input, endpointPrefix);
    }
}