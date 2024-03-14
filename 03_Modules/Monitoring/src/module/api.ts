// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';
import { IMonitoringModuleApi } from './interface';
import { MonitoringModule } from './module';
import { CreateOrUpdateVariableAttributeQuerySchema, CreateOrUpdateVariableAttributeQuerystring, sequelize, VariableAttributeQuerySchema, VariableAttributeQuerystring } from '@citrineos/data';
import { AbstractModuleApi, AsMessageEndpoint, CallAction, SetVariablesRequestSchema, SetVariablesRequest, IMessageConfirmation, SetVariableDataType, GetVariablesRequestSchema, GetVariablesRequest, GetVariableDataType, AsDataEndpoint, Namespace, HttpMethod, ReportDataTypeSchema, ReportDataType, SetVariableStatusEnumType, ClearVariableMonitoringRequest, ClearVariableMonitoringRequestSchema, SetMonitoringBaseRequest, SetMonitoringBaseRequestSchema, SetMonitoringLevelRequest, SetMonitoringLevelRequestSchema, SetVariableMonitoringRequest, SetVariableMonitoringRequestSchema, GetMonitoringReportRequest, GetMonitoringReportRequestSchema } from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { Variable, Component, Evse } from '@citrineos/data/lib/layers/sequelize';

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
     * Message Endpoints
     */

    @AsMessageEndpoint(CallAction.SetVariableMonitoring, SetVariableMonitoringRequestSchema)
    setVariableMonitoring(identifier: string, tenantId: string, request: SetVariableMonitoringRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.SetVariableMonitoring, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.ClearVariableMonitoring, ClearVariableMonitoringRequestSchema)
    clearVariableMonitoring(identifier: string, tenantId: string, request: ClearVariableMonitoringRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.ClearVariableMonitoring, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.SetMonitoringLevel, SetMonitoringLevelRequestSchema)
    setMonitoringLevel(identifier: string, tenantId: string, request: SetMonitoringLevelRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.SetMonitoringLevel, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.SetMonitoringBase, SetMonitoringBaseRequestSchema)
    setMonitoringBase(identifier: string, tenantId: string, request: SetMonitoringBaseRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.SetMonitoringBase, request, callbackUrl);
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

    /**
     * Data Endpoints
     */

    @AsDataEndpoint(Namespace.VariableAttributeType, HttpMethod.Put, CreateOrUpdateVariableAttributeQuerySchema, ReportDataTypeSchema)
    async putDeviceModelVariables(request: FastifyRequest<{ Body: ReportDataType, Querystring: CreateOrUpdateVariableAttributeQuerystring }>): Promise<sequelize.VariableAttribute[]> {
        return this._module.deviceModelRepository.createOrUpdateDeviceModelByStationId(request.body, request.query.stationId).then(async variableAttributes => {
            if (request.query.setOnCharger) { // value set offline, for example: manually via charger ui, or via api other than ocpp
                for (let variableAttribute of variableAttributes) {
                    variableAttribute = await variableAttribute.reload({ include: [Variable, { model: Component, include: [Evse] }] });
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
        const endpointPrefix = this._module.config.modules.monitoring.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.modules.monitoring.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}