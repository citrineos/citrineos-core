// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';
import { ISmartChargingModuleApi } from './interface';
import { SmartChargingModule } from './module';
import { AbstractModuleApi, CallAction, Namespace } from '@citrineos/base';
import { FastifyInstance } from 'fastify';

/**
 * Server API for the SmartCharging module.
 */
export class SmartChargingModuleApi extends AbstractModuleApi<SmartChargingModule> implements ISmartChargingModuleApi {

    /**
     * Constructs a new instance of the class.
     *
     * @param {SmartChargingModule} SmartChargingModule - The SmartCharging module.
     * @param {FastifyInstance} server - The Fastify server instance.
     * @param {Logger<ILogObj>} [logger] - The logger instance.
     */
    constructor(SmartChargingModule: SmartChargingModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(SmartChargingModule, server, logger);
    }

    /**
     * Message endpoints
     */

    /**
     * Data endpoints
     */

    /**
    * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
    *
    * @param {CallAction} input - The input {@link CallAction}.
    * @return {string} - The generated URL path.
    */
    protected _toMessagePath(input: CallAction): string {
        const endpointPrefix = this._module.config.modules.smartcharging?.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.modules.smartcharging?.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}