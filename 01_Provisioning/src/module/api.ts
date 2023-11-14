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

import { AbstractModuleApi, AsDataEndpoint, AsMessageEndpoint, BootConfig, BootConfigSchema, BootNotificationResponse, CallAction, GetBaseReportRequest, GetBaseReportRequestSchema, GetReportRequest, GetReportRequestSchema, GetVariableDataType, GetVariablesRequest, GetVariablesRequestSchema, HttpMethod, IMessageConfirmation, Namespace, ReportDataType, ReportDataTypeSchema, ResetRequest, ResetRequestSchema, SetNetworkProfileRequest, SetNetworkProfileRequestSchema, SetVariableDataType, SetVariableStatusEnumType, SetVariablesRequest, SetVariablesRequestSchema, TriggerMessageRequest, TriggerMessageRequestSchema } from '@citrineos/base';
import { ChargingStationKeyQuerySchema, ChargingStationKeyQuerystring, CreateOrUpdateVariableAttributeQuerySchema, CreateOrUpdateVariableAttributeQuerystring, VariableAttributeQuerySchema, VariableAttributeQuerystring, sequelize } from '@citrineos/data';
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

    @AsMessageEndpoint(CallAction.SetVariables, SetVariablesRequestSchema)
    async setVariables(
        identifier: string,
        tenantId: string,
        request: SetVariablesRequest,
        callbackUrl?: string
    ): Promise<IMessageConfirmation> {
        let setVariableData = request.setVariableData as SetVariableDataType[];

        // Awaiting save action so that SetVariablesResponse does not trigger a race condition since an error is thrown
        // from SetVariablesResponse handler if variable does not exist when it attempts to save the Response's status
        await this._module.deviceModelRepository.createOrUpdateBySetVariablesDataAndStationId(setVariableData, identifier);

        let itemsPerMessageSetVariables = await this._module._deviceModelService.getItemsPerMessageSetVariablesByStationId(identifier);

        // If ItemsPerMessageSetVariables not set, send all variables at once
        itemsPerMessageSetVariables = itemsPerMessageSetVariables == null ?
            setVariableData.length : itemsPerMessageSetVariables;

        const confirmations = [];
        let lastVariableIndex = 0;
        // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
        while (setVariableData.length > 0) {
            const batch = setVariableData.slice(0, itemsPerMessageSetVariables);
            try {
                const batchResult = await this._module.sendCall(identifier, tenantId, CallAction.SetVariables, { setVariableData: batch } as SetVariablesRequest, callbackUrl);
                confirmations.push({
                    success: batchResult.success,
                    batch: `[${lastVariableIndex}:${lastVariableIndex + batch.length}]`,
                    message: `${batchResult.payload}`,
                });
            } catch (error) {
                confirmations.push({
                    success: false,
                    variableName: `[${lastVariableIndex}:${lastVariableIndex + batch.length}]`,
                    message: `${error}`,
                });
            }
            lastVariableIndex += batch.length;
            setVariableData = setVariableData.slice(itemsPerMessageSetVariables);
        }
        // Caller should use callbackUrl to ensure request reached station, otherwise receipt is not guaranteed
        return { success: true, payload: confirmations };
    }

    @AsMessageEndpoint(CallAction.GetVariables, GetVariablesRequestSchema)
    async getVariables(
        identifier: string,
        tenantId: string,
        request: GetVariablesRequest,
        callbackUrl?: string
    ): Promise<IMessageConfirmation> {
        let getVariableData = request.getVariableData as GetVariableDataType[];
        let itemsPerMessageGetVariables = await this._module._deviceModelService.getItemsPerMessageGetVariablesByStationId(identifier);

        // If ItemsPerMessageGetVariables not set, send all variables at once
        itemsPerMessageGetVariables = itemsPerMessageGetVariables == null ?
            getVariableData.length : itemsPerMessageGetVariables;

        const confirmations = [];
        let lastVariableIndex = 0;
        // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
        while (getVariableData.length > 0) { 
            const batch = getVariableData.slice(0, itemsPerMessageGetVariables);
            try {
                const batchResult = await this._module.sendCall(identifier, tenantId, CallAction.GetVariables, { getVariableData: batch } as GetVariablesRequest, callbackUrl);
                confirmations.push({
                    success: batchResult.success,
                    batch: `[${lastVariableIndex}:${lastVariableIndex + batch.length}]`,
                    message: `${batchResult.payload}`,
                });
            } catch (error) {
                confirmations.push({
                    success: false,
                    variableName: `[${lastVariableIndex}:${lastVariableIndex + batch.length}]`,
                    message: `${error}`,
                });
            }
            lastVariableIndex += batch.length;
            getVariableData = getVariableData.slice(itemsPerMessageGetVariables);
        }
        // Caller should use callbackUrl to ensure request reached station, otherwise receipt is not guaranteed
        return { success: true, payload: confirmations };
    }

    @AsMessageEndpoint(CallAction.SetNetworkProfile, SetNetworkProfileRequestSchema)
    setNetworkProfile(
        identifier: string,
        tenantId: string,
        request: SetNetworkProfileRequest,
        callbackUrl?: string
    ): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.SetNetworkProfile, request, callbackUrl);
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

    @AsDataEndpoint(Namespace.VariableAttributeType, HttpMethod.Put, CreateOrUpdateVariableAttributeQuerySchema, ReportDataTypeSchema)
    putDeviceModelVariables(request: FastifyRequest<{ Body: ReportDataType, Querystring: CreateOrUpdateVariableAttributeQuerystring }>): Promise<sequelize.VariableAttribute[]> {
        return this._module.deviceModelRepository.createOrUpdateDeviceModelByStationId(request.body, request.query.stationId).then(variableAttributes => {
            if (request.query.setOnCharger) { // value set offline, for example: manually via charger ui, or via api other than ocpp
                for (const variableAttribute of variableAttributes) {
                    this._module.deviceModelRepository.updateResultByStationId({
                        attributeType: variableAttribute.type,
                        attributeStatus: SetVariableStatusEnumType.Accepted, attributeStatusInfo: { reasonCode: "SetOnCharger" },
                        component: variableAttribute.component, variable: variableAttribute.variable
                      }, request.query.stationId);
                }
            }
            return variableAttributes;
        });
    }

    @AsDataEndpoint(Namespace.VariableAttributeType, HttpMethod.Get, VariableAttributeQuerySchema)
    getDeviceModelVariables(request: FastifyRequest<{ Querystring: VariableAttributeQuerystring }>): Promise<sequelize.VariableAttribute[] | undefined> {
        return this._module.deviceModelRepository.readAllByQuery(request.query);
    }

    @AsDataEndpoint(Namespace.VariableAttributeType, HttpMethod.Delete, VariableAttributeQuerySchema)
    deleteDeviceModelVariables(request: FastifyRequest<{ Querystring: VariableAttributeQuerystring }>): Promise<string> {
        return this._module.deviceModelRepository.deleteAllByQuery(request.query)
            .then(deletedCount => deletedCount.toString() + " rows successfully deleted from " + Namespace.VariableAttributeType);
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