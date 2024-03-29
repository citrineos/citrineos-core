// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
    SetVariableDataType,
    ICrudRepository,
    SetVariableResultType,
    AuthorizationData,
    TransactionEventRequest,
    ChargingStateEnumType,
    IdTokenType,
    VariableAttributeType,
    ReportDataType,
    BootConfig,
    RegistrationStatusEnumType,
    StatusInfoType,
    GetVariableResultType,
    EVSEType,
    SecurityEventNotificationRequest,
    VariableType,
    ComponentType,
    MonitoringDataType,
    VariableMonitoringType,
    SetMonitoringDataType,
    SetMonitoringResultType,
    EventDataType,
    CallAction,
    MessageInfoType
} from "@citrineos/base";
import { AuthorizationQuerystring } from "./queries/Authorization";
import {AuthorizationRestrictions, TariffQueryString, VariableAttributeQuerystring} from ".";
import {
    Boot,
    Authorization,
    Location,
    SecurityEvent,
    Component,
    Variable,
    VariableAttribute,
    VariableMonitoring,
    EventData,
    ChargingStation,
    Transaction,
    MessageInfo,
    Tariff, MeterValue
} from "../layers/sequelize";

export interface IAuthorizationRepository extends ICrudRepository<AuthorizationData> {
    createOrUpdateByQuery(value: AuthorizationData, query: AuthorizationQuerystring): Promise<Authorization | undefined>;
    updateRestrictionsByQuery(value: AuthorizationRestrictions, query: AuthorizationQuerystring): Promise<Authorization | undefined>;
    readByQuery(query: AuthorizationQuerystring): Promise<Authorization | undefined>;
    existsByQuery(query: AuthorizationQuerystring): Promise<boolean>;
    deleteAllByQuery(query: AuthorizationQuerystring): Promise<number>;
}

/**
 * Key is StationId
 */
export interface IBootRepository extends ICrudRepository<BootConfig> {
    createOrUpdateByKey(value: BootConfig, key: string): Promise<Boot | undefined>;
    updateStatusByKey(status: RegistrationStatusEnumType, statusInfo: StatusInfoType | undefined, key: string): Promise<Boot | undefined>;
    updateLastBootTimeByKey(lastBootTime: string, key: string): Promise<Boot | undefined>;
    readByKey(key: string): Promise<Boot | undefined>;
    existsByKey(key: string): Promise<boolean>;
    deleteByKey(key: string): Promise<boolean>;
}

export interface IDeviceModelRepository extends ICrudRepository<VariableAttributeType> {
    createOrUpdateDeviceModelByStationId(value: ReportDataType, stationId: string): Promise<VariableAttribute[]>;
    createOrUpdateByGetVariablesResultAndStationId(getVariablesResult: GetVariableResultType[], stationId: string): Promise<VariableAttribute[]>;
    createOrUpdateBySetVariablesDataAndStationId(setVariablesData: SetVariableDataType[], stationId: string): Promise<VariableAttribute[]>;
    updateResultByStationId(result: SetVariableResultType, stationId: string): Promise<VariableAttribute | undefined>;
    readAllSetVariableByStationId(stationId: string): Promise<SetVariableDataType[]>;
    readAllByQuery(query: VariableAttributeQuerystring): Promise<VariableAttribute[]>;
    existsByQuery(query: VariableAttributeQuerystring): Promise<boolean>;
    deleteAllByQuery(query: VariableAttributeQuerystring): Promise<number>;
    findComponentAndVariable(componentType: ComponentType, variableType: VariableType): Promise<[Component | null, Variable | null]>
    findAttributeByComponentAndVariableAndStationId(componentName: string, variableName: string, variableInstance: string | null, stationId: string): Promise<boolean | null>
}

export interface ILocationRepository extends ICrudRepository<Location> { 
    readChargingStationByStationId(stationId: string): Promise<ChargingStation | null>
}

export interface ISecurityEventRepository extends ICrudRepository<SecurityEvent> {
    createByStationId(value: SecurityEventNotificationRequest, stationId: string): Promise<SecurityEvent | undefined>;
    readByStationIdAndTimestamps(stationId: string, from?: Date, to?: Date): Promise<SecurityEvent[]>;
    deleteByKey(key: string): Promise<boolean>;
}

export interface ITransactionEventRepository extends ICrudRepository<TransactionEventRequest> {
    createOrUpdateTransactionByTransactionEventAndStationId(value: TransactionEventRequest, stationId: string): Promise<Transaction>;
    readAllByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<TransactionEventRequest[]>;
    readTransactionByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<Transaction | undefined>;
    readAllTransactionsByStationIdAndEvseAndChargingStates(stationId: string, evse: EVSEType, chargingStates?: ChargingStateEnumType[]): Promise<Transaction[]>;
    readAllActiveTransactionsByIdToken(idToken: IdTokenType): Promise<Transaction[]>;
    readAllActiveTransactionsByStationId(stationId: string): Promise<Transaction[]>;
    readAllMeterValuesByTransactionDataBaseId(transactionDataBaseId: number): Promise<MeterValue[]>;
}

export interface IVariableMonitoringRepository extends ICrudRepository<VariableMonitoringType> {
    createOrUpdateByMonitoringDataTypeAndStationId(value: MonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring[]>;
    createOrUpdateBySetMonitoringDataTypeAndStationId(value: SetMonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring>;
    rejectAllVariableMonitoringsByStationId(action: CallAction, stationId: string): Promise<void>;
    rejectVariableMonitoringByIdAndStationId(action: CallAction, id: number, stationId: string): Promise<void>
    updateResultByStationId(result: SetMonitoringResultType, stationId: string): Promise<VariableMonitoring | undefined>
    createEventDatumByComponentIdAndVariableIdAndStationId(event: EventDataType, componentId: string, variableId: string, stationId: string): Promise<EventData>
}

export interface IMessageInfoRepository extends ICrudRepository<MessageInfoType> {
    deactivateAllByStationId(stationId: string): Promise<void>;
    createOrUpdateByMessageInfoTypeAndStationId(value: MessageInfoType, stationId: string): Promise<MessageInfo>;
}

export interface ITariffRepository extends ICrudRepository<Tariff> {
    findByStationId(stationId: string): Promise<Tariff | null>;
    readAllByQuery(query: TariffQueryString): Promise<Tariff[]>;
    deleteAllByQuery(query: TariffQueryString): Promise<number>;
    createOrUpdateTariff(tariff: Tariff): Promise<Tariff>;
}