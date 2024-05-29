// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  MessageInfoType,
  type AuthorizationData,
  type BootConfig,
  type CallAction,
  type ChargingStateEnumType,
  type ComponentType,
  type EventDataType,
  type EVSEType,
  type GetVariableResultType,
  type ICrudRepository,
  type IdTokenType,
  type MonitoringDataType,
  type RegistrationStatusEnumType,
  type ReportDataType,
  type SecurityEventNotificationRequest,
  type SetMonitoringDataType,
  type SetMonitoringResultType,
  type SetVariableDataType,
  type SetVariableResultType,
  type StatusInfoType,
  type TransactionEventRequest,
  type VariableAttributeType,
  type VariableMonitoringType,
  type VariableType,
} from '@citrineos/base';
import { type AuthorizationQuerystring } from './queries/Authorization';
import { MeterValue, type Transaction } from '../layers/sequelize/model/TransactionEvent';
import { type VariableAttribute } from '../layers/sequelize/model/DeviceModel/VariableAttribute';
import { type AuthorizationRestrictions, type VariableAttributeQuerystring } from '.';
import { type Authorization, type Boot, type Certificate, type ChargingStation, type Component, type EventData, type Location, type SecurityEvent, type Variable, type VariableMonitoring } from '../layers/sequelize';
import { MessageInfo } from '../layers/sequelize/model/MessageInfo';
import { Subscription } from '../layers/sequelize/model/Subscription';
import { Tariff } from '../layers/sequelize/model/Tariff';
import { TariffQueryString } from './queries/Tariff';

export interface IAuthorizationRepository extends ICrudRepository<AuthorizationData> {
  createOrUpdateByQuery: (value: AuthorizationData, query: AuthorizationQuerystring) => Promise<Authorization | undefined>;
  updateRestrictionsByQuery: (value: AuthorizationRestrictions, query: AuthorizationQuerystring) => Promise<Authorization | undefined>;
  readByQuery: (query: AuthorizationQuerystring) => Promise<Authorization | undefined>;
  existsByQuery: (query: AuthorizationQuerystring) => Promise<boolean>;
  deleteAllByQuery: (query: AuthorizationQuerystring) => Promise<number>;
}

/**
 * Key is StationId
 */
export interface IBootRepository extends ICrudRepository<BootConfig> {
  createOrUpdateByKey: (value: BootConfig, key: string) => Promise<Boot | undefined>;
  updateStatusByKey: (status: RegistrationStatusEnumType, statusInfo: StatusInfoType | undefined, key: string) => Promise<Boot | undefined>;
  updateLastBootTimeByKey: (lastBootTime: string, key: string) => Promise<Boot | undefined>;
  readByKey: (key: string) => Promise<Boot | undefined>;
  existsByKey: (key: string) => Promise<boolean>;
  deleteByKey: (key: string) => Promise<boolean>;
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
  findComponentAndVariable(componentType: ComponentType, variableType: VariableType): Promise<[Component | null, Variable | null]>;
  findOrCreateEvseAndComponent(componentType: ComponentType, stationId: string): Promise<Component>;
}

export interface ILocationRepository extends ICrudRepository<Location> {
  readChargingStationByStationId: (stationId: string) => Promise<ChargingStation | null>;
}

export interface ISecurityEventRepository extends ICrudRepository<SecurityEvent> {
  createByStationId: (value: SecurityEventNotificationRequest, stationId: string) => Promise<SecurityEvent | undefined>;
  readByStationIdAndTimestamps: (stationId: string, from?: Date, to?: Date) => Promise<SecurityEvent[]>;
  deleteByKey: (key: string) => Promise<boolean>;
}

export interface ISubscriptionRepository extends ICrudRepository<Subscription> {
  create(value: Subscription): Promise<Subscription | undefined>;
  readAllByStationId(stationId: string): Promise<Subscription[]>;
  deleteByKey(key: string): Promise<boolean>;
}

export interface ITransactionEventRepository extends ICrudRepository<TransactionEventRequest> {
  createOrUpdateTransactionByTransactionEventAndStationId(value: TransactionEventRequest, stationId: string): Promise<Transaction>;
  readAllByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<TransactionEventRequest[]>;
  readTransactionByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<Transaction | undefined>;
  readAllTransactionsByStationIdAndEvseAndChargingStates(stationId: string, evse: EVSEType, chargingStates?: ChargingStateEnumType[]): Promise<Transaction[]>;
  readAllActiveTransactionsByIdToken(idToken: IdTokenType): Promise<Transaction[]>;
  readAllMeterValuesByTransactionDataBaseId(transactionDataBaseId: number): Promise<MeterValue[]>;
}

export interface IVariableMonitoringRepository extends ICrudRepository<VariableMonitoringType> {
  createOrUpdateByMonitoringDataTypeAndStationId(value: MonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring[]>;
  createOrUpdateBySetMonitoringDataTypeAndStationId(value: SetMonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring>;
  rejectAllVariableMonitoringsByStationId(action: CallAction, stationId: string): Promise<void>;
  rejectVariableMonitoringByIdAndStationId(action: CallAction, id: number, stationId: string): Promise<void>;
  updateResultByStationId(result: SetMonitoringResultType, stationId: string): Promise<VariableMonitoring | undefined>;
  createEventDatumByComponentIdAndVariableIdAndStationId(event: EventDataType, componentId: string, variableId: string, stationId: string): Promise<EventData>;
}

export interface IMessageInfoRepository extends ICrudRepository<MessageInfoType> {
  deactivateAllByStationId(stationId: string): Promise<void>;
  createOrUpdateByMessageInfoTypeAndStationId(value: MessageInfoType, stationId: string, componentId?: number): Promise<MessageInfo>;
}

export interface ITariffRepository extends ICrudRepository<Tariff> {
  findByStationId(stationId: string): Promise<Tariff | null>;
  readAllByQuery(query: TariffQueryString): Promise<Tariff[]>;
  deleteAllByQuery(query: TariffQueryString): Promise<number>;
  createOrUpdateTariff(tariff: Tariff): Promise<Tariff>;
}

export interface ICertificateRepository extends ICrudRepository<Certificate> {
  createOrUpdateCertificate(certificate: Certificate): Promise<Certificate>;
}
