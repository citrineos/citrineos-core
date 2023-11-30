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

import { AbstractModuleApi, AsMessageEndpoint, CallAction, CustomerInformationRequest, CustomerInformationRequestSchema, GetLogRequest, GetLogRequestSchema, GetMonitoringReportRequest, GetMonitoringReportRequestSchema, IMessageConfirmation, Namespace } from '@citrineos/base';
import { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IMonitoringModuleApi } from './interface';
import { MonitoringModule } from './module';

/**
 * Server API for the Monitoring module.
 */
export class MonitoringModuleApi extends AbstractModuleApi<MonitoringModule> implements IMonitoringModuleApi {

    /**
     * Constructor for the class.
     *
     * @param {MonitoringModule} monitoringModule - The monitoring module.
     * @param {FastifyInstance} server - The server instance.
     * @param {Logger<ILogObj>} [logger] - The logger instance.
     */
    constructor(monitoringModule: MonitoringModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(monitoringModule, server, logger);
    }

    /**
     * Interface implementation
     */

    @AsMessageEndpoint(CallAction.GetMonitoringReport, GetMonitoringReportRequestSchema)
    getMonitoringReport(identifier: string, tenantId: string, request: GetMonitoringReportRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.GetMonitoringReport, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.GetLog, GetLogRequestSchema)
    getLog(identifier: string, tenantId: string, request: GetLogRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.GetLog, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.CustomerInformation, CustomerInformationRequestSchema)
    customerInformation(identifier: string, tenantId: string, request: CustomerInformationRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.CustomerInformation, request, callbackUrl);
    }

    /**
    * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
    *
    * @param {CallAction} input - The input {@link CallAction}.
    * @return {string} - The generated URL path.
    */
    protected _toMessagePath(input: CallAction): string {
        const endpointPrefix = this._module.config.monitoring.api.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.monitoring.api.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}