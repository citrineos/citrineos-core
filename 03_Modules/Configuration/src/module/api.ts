// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IConfigurationModuleApi } from './interface';
import { ConfigurationModule } from './module';
import { AbstractModuleApi, AsMessageEndpoint, CallAction, SetNetworkProfileRequestSchema, SetNetworkProfileRequest, IMessageConfirmation, UpdateFirmwareRequestSchema, UpdateFirmwareRequest, ResetRequestSchema, ResetRequest, TriggerMessageRequestSchema, TriggerMessageRequest, AsDataEndpoint, Namespace, HttpMethod, BootConfigSchema, BootNotificationResponse, BootConfig } from '@citrineos/base';
import { ChargingStationKeyQuerySchema, ChargingStationKeyQuerystring, Boot } from '@citrineos/data';

/**
 * Server API for the Configuration component.
 */
export class ConfigurationModuleApi extends AbstractModuleApi<ConfigurationModule> implements IConfigurationModuleApi {

    /**
     * Constructor for the class.
     *
     * @param {ConfigurationModule} ConfigurationComponent - The Configuration component.
     * @param {FastifyInstance} server - The server instance.
     * @param {Logger<ILogObj>} [logger] - Optional logger instance.
     */
    constructor(ConfigurationComponent: ConfigurationModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(ConfigurationComponent, server, logger);
    }

    /**
     * Message Endpoint Methods
     */

    @AsMessageEndpoint(CallAction.SetNetworkProfile, SetNetworkProfileRequestSchema)
    setNetworkProfile(
        identifier: string,
        tenantId: string,
        request: SetNetworkProfileRequest,
        callbackUrl?: string
    ): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.SetNetworkProfile, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.UpdateFirmware, UpdateFirmwareRequestSchema)
    updateFirmware(
        identifier: string,
        tenantId: string,
        request: UpdateFirmwareRequest,
        callbackUrl?: string
    ): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.UpdateFirmware, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.Reset, ResetRequestSchema)
    reset(
        identifier: string,
        tenantId: string,
        request: ResetRequest,
        callbackUrl?: string
    ): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.Reset, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.TriggerMessage, TriggerMessageRequestSchema)
    triggerMessage(
        identifier: string,
        tenantId: string,
        request: TriggerMessageRequest,
        callbackUrl?: string
    ): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.TriggerMessage, request, callbackUrl);
    }

    /**
     * Data Endpoints
     */

    @AsDataEndpoint(Namespace.BootConfig, HttpMethod.Put, ChargingStationKeyQuerySchema, BootConfigSchema)
    putBootConfig(request: FastifyRequest<{ Body: BootNotificationResponse, Querystring: ChargingStationKeyQuerystring }>): Promise<BootConfig | undefined> {
        return this._module.bootRepository.createOrUpdateByKey(request.body, request.query.stationId);
    }

    @AsDataEndpoint(Namespace.BootConfig, HttpMethod.Get, ChargingStationKeyQuerySchema)
    getBootConfig(request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>): Promise<Boot | undefined> {
        return this._module.bootRepository.readByKey(request.query.stationId);
    }

    @AsDataEndpoint(Namespace.BootConfig, HttpMethod.Delete, ChargingStationKeyQuerySchema)
    deleteBootConfig(request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>): Promise<boolean> {
        return this._module.bootRepository.deleteByKey(request.query.stationId);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link CallAction}.
     * @return {string} - The generated URL path.
     */
    protected _toMessagePath(input: CallAction): string {
        const endpointPrefix = this._module.config.modules.configuration.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.modules.configuration.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}