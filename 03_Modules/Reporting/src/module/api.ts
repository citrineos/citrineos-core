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

import { ILogObj, Logger } from 'tslog';
import { AbstractModuleApi, AsMessageEndpoint, CallAction, GetMonitoringReportRequestSchema, GetMonitoringReportRequest, IMessageConfirmation, GetLogRequestSchema, GetLogRequest, CustomerInformationRequestSchema, CustomerInformationRequest, Namespace, GetBaseReportRequest, GetBaseReportRequestSchema, GetReportRequest, GetReportRequestSchema } from '@citrineos/base';
import { FastifyInstance } from 'fastify';
import { IReportingModuleApi } from './interface';
import { ReportingModule } from './module';

/**
 * Server API for the Reporting module.
 */
export class ReportingModuleApi extends AbstractModuleApi<ReportingModule> implements IReportingModuleApi {

    /**
     * Constructs a new instance of the class.
     *
     * @param {ReportingModule} ReportingModule - The Reporting module.
     * @param {FastifyInstance} server - The Fastify server instance.
     * @param {Logger<ILogObj>} [logger] - The logger instance.
     */
    constructor(ReportingModule: ReportingModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(ReportingModule, server, logger);
    }


    /**
     * Message Endpoint Methods
     */

    @AsMessageEndpoint(CallAction.GetBaseReport, GetBaseReportRequestSchema)
    getBaseReport(
        identifier: string,
        tenantId: string,
        request: GetBaseReportRequest,
        callbackUrl?: string
    ): Promise<IMessageConfirmation> {
        // TODO: Consider using requestId to send NotifyReportRequests to callbackUrl
        return this._module.sendCall(identifier, tenantId, CallAction.GetBaseReport, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.GetReport, GetReportRequestSchema)
    getCustomReport(
        identifier: string,
        tenantId: string,
        request: GetReportRequest,
        callbackUrl?: string
    ): Promise<IMessageConfirmation> {
        // TODO: Consider using requestId to send NotifyReportRequests to callbackUrl
        return this._module.sendCall(identifier, tenantId, CallAction.GetReport, request, callbackUrl);
    }

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
        const endpointPrefix = this._module.config.modules.reporting.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.modules.reporting.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}