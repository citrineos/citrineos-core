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

import { AbstractModuleApi, AsMessageEndpoint, CallAction, ChangeAvailabilityRequest, ChangeAvailabilityRequestSchema, IMessageConfirmation, Namespace } from '@citrineos/base';
import { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IAvailabilityModuleApi } from './interface';
import { AvailabilityModule } from './module';

/**
 * Server API for the availability module.
 */
export class AvailabilityModuleApi extends AbstractModuleApi<AvailabilityModule> implements IAvailabilityModuleApi {

    /**
     * Constructs a new instance of the class.
     *
     * @param {AvailabilityModule} availabilityModule - The availability module.
     * @param {FastifyInstance} server - The Fastify server instance.
     * @param {Logger<ILogObj>} [logger] - The logger instance.
     */
    constructor(availabilityModule: AvailabilityModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(availabilityModule, server, logger);
    }

    /**
   * Interface implementation
   */

    @AsMessageEndpoint(CallAction.ChangeAvailability, ChangeAvailabilityRequestSchema)
    changeAvailability(identifier: string, tenantId: string, request: ChangeAvailabilityRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.ChangeAvailability, request, callbackUrl);
    }

    /**
    * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
    *
    * @param {CallAction} input - The input {@link CallAction}.
    * @return {string} - The generated URL path.
    */
    protected _toMessagePath(input: CallAction): string {
        const endpointPrefix = this._module.config.availability.api.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.availability.api.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}