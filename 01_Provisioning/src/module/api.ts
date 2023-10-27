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

import { AbstractModuleApi, AsDataEndpoint, AsMessageEndpoint, BootConfig, BootConfigSchema, BootNotificationResponse, CallAction, GetBaseReportRequest, GetBaseReportRequestSchema, GetVariableDataType, GetVariablesRequest, GetVariablesRequestSchema, HttpMethod, IMessageConfirmation, Namespace, ReportDataType, ReportDataTypeSchema, ResetRequest, ResetRequestSchema, SetNetworkProfileRequest, SetNetworkProfileRequestSchema, SetVariableDataType, SetVariablesRequest, SetVariablesRequestSchema } from '@citrineos/base';
import { ChargingStationKeyQuerySchema, ChargingStationKeyQuerystring, VariableAttributeQuerySchema, VariableAttributeQuerystring, sequelize } from '@citrineos/data';
import { Boot } from '@citrineos/data/lib/layers/sequelize';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IProvisioningModuleApi } from './interface';
import { ProvisioningModule } from './module';

/**
 * Server API for the provisioning component.
 */
export class ProvisioningModuleApi extends AbstractModuleApi<ProvisioningModule> implements IProvisioningModuleApi {

    /**
     * Constructor for the class.
     *
     * @param {ProvisioningModule} provisioningComponent - The provisioning component.
     * @param {FastifyInstance} server - The server instance.
     * @param {Logger<ILogObj>} [logger] - Optional logger instance.
     */
    constructor(provisioningComponent: ProvisioningModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(provisioningComponent, server, logger);
    }

    /**
     * Message Endpoint Methods
     */

    @AsMessageEndpoint(CallAction.GetBaseReport, GetBaseReportRequestSchema)
    getBaseReport(
        identifier: string,
        tenantId: string,
        request: GetBaseReportRequest
    ): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.GetBaseReport, request);
    }

    @AsMessageEndpoint(CallAction.SetVariables, SetVariablesRequestSchema)
    async setVariables(
        identifier: string,
        tenantId: string,
        request: SetVariablesRequest
    ): Promise<IMessageConfirmation> {
        const setVariableData = request.setVariableData;

        // Awaiting save action so that SetVariablesResponse does not trigger a race condition since an error is thrown
        // from SetVariablesResponse handler if variable does not exist when it attempts to save the Response's status
        await this._module.deviceModelRepository.createOrUpdateBySetVariablesDataAndStationId(setVariableData, identifier);

        let itemsPerMessageSetVariables = await this._module._deviceModelService.getItemsPerMessageSetVariablesByStationId(identifier);

        // If ItemsPerMessageSetVariables not set, send all variables at once
        itemsPerMessageSetVariables = itemsPerMessageSetVariables == null ?
            setVariableData.length : itemsPerMessageSetVariables;

        // We don't wait for each message to be responded to, instead this is fire-and-forget.
        // Only a failure from the message bus to the central system is caught, downstream failures are invisible.
        // Users can pull these variables from the data endpoint to check results afterwards.
        // Max wait time before being able to view results should be:
        // (setVariableData.length / itemsPerMessageSetVariables) * this.config.websocketServer.maxCallLengthSeconds
        // TODO: Consider adding a callback url to response to check results
        const finalMessageConfirmation: IMessageConfirmation = { success: true };
        while (setVariableData.length > 0) {
            const setVariableDataSubset = setVariableData.slice(0, itemsPerMessageSetVariables);
            const messageConfirmation = await this._module.sendCall(identifier, tenantId, CallAction.SetVariables,
                { setVariableData: setVariableDataSubset } as SetVariablesRequest);
            if (!messageConfirmation.payload) {
                finalMessageConfirmation.success = false;
                finalMessageConfirmation.payload = finalMessageConfirmation.payload ?
                    (finalMessageConfirmation.payload as SetVariableDataType[]).concat(setVariableDataSubset) : setVariableDataSubset
            }
        }
        return finalMessageConfirmation;
    }

    @AsMessageEndpoint(CallAction.GetVariables, GetVariablesRequestSchema)
    async getVariables(
        identifier: string,
        tenantId: string,
        request: GetVariablesRequest
    ): Promise<IMessageConfirmation> {
        const getVariableData = request.getVariableData;
        let itemsPerMessageGetVariables = await this._module._deviceModelService.getItemsPerMessageGetVariablesByStationId(identifier);

        // If ItemsPerMessageGetVariables not set, send all variables at once
        itemsPerMessageGetVariables = itemsPerMessageGetVariables == null ?
            getVariableData.length : itemsPerMessageGetVariables;

        // We don't wait for each message to be responded to, instead this is fire-and-forget.
        // Only a failure from the message bus to the central system is caught, downstream failures are invisible.
        const finalMessageConfirmation: IMessageConfirmation = { success: true };
        while (getVariableData.length > 0) {
            const getVariableDataSubset = getVariableData.slice(0, itemsPerMessageGetVariables);
            const messageConfirmation = await this._module.sendCall(identifier, tenantId, CallAction.GetVariables,
                { getVariableData: getVariableDataSubset } as GetVariablesRequest);
            if (!messageConfirmation.payload) {
                finalMessageConfirmation.success = false;
                finalMessageConfirmation.payload = finalMessageConfirmation.payload ?
                    (finalMessageConfirmation.payload as GetVariableDataType[]).concat(getVariableDataSubset) : getVariableDataSubset
            }
        }
        return finalMessageConfirmation;
    }

    @AsMessageEndpoint(CallAction.SetNetworkProfile, SetNetworkProfileRequestSchema)
    setNetworkProfile(
        identifier: string,
        tenantId: string,
        request: SetNetworkProfileRequest
    ): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.SetNetworkProfile, request);
    }

    @AsMessageEndpoint(CallAction.Reset, ResetRequestSchema)
    reset(
        identifier: string,
        tenantId: string,
        resetRequest: ResetRequest
    ): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.Reset, resetRequest);
    }

    /**
     * Data Endpoint Methods
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

    @AsDataEndpoint(Namespace.VariableAttributeType, HttpMethod.Put, VariableAttributeQuerySchema, ReportDataTypeSchema)
    putDeviceModelVariables(request: FastifyRequest<{ Body: ReportDataType, Querystring: ChargingStationKeyQuerystring }>): Promise<sequelize.VariableAttribute[]> {
        return this._module.deviceModelRepository.createOrUpdateDeviceModelByStationId(request.body, request.query.stationId);
    }

    @AsDataEndpoint(Namespace.VariableAttributeType, HttpMethod.Get, VariableAttributeQuerySchema)
    getDeviceModelVariables(request: FastifyRequest<{ Querystring: VariableAttributeQuerystring }>): Promise<sequelize.VariableAttribute[] | undefined> {
        return this._module.deviceModelRepository.readAllByQuery(request.query);
    }

    @AsDataEndpoint(Namespace.VariableAttributeType, HttpMethod.Delete, VariableAttributeQuerySchema)
    deleteDeviceModelVariables(request: FastifyRequest<{ Querystring: VariableAttributeQuerystring }>): Promise<string> {
        return this._module.deviceModelRepository.deleteAllByQuery(request.query)
            .then(deletedCount => deletedCount.toString + " rows successfully deleted from " + Namespace.VariableAttributeType);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link CallAction}.
     * @return {string} - The generated URL path.
     */
    protected _toMessagePath(input: CallAction): string {
        const endpointPrefix = this._module.config.provisioning.api.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.provisioning.api.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}