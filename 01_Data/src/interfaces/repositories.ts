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
  type CrudRepository,
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
  ChargingProfileType,
  NotifyEVChargingNeedsRequest,
  ChargingLimitSourceEnumType,
  CompositeScheduleType,
  StatusNotificationRequest,
} from '@citrineos/base';
import { type AuthorizationQuerystring } from './queries/Authorization';
import { CompositeSchedule, MeterValue, type Transaction, VariableCharacteristics } from '../layers/sequelize';
import { type VariableAttribute } from '../layers/sequelize';
import { type AuthorizationRestrictions, type VariableAttributeQuerystring } from '.';
import { type Authorization, type Boot, type Certificate, ChargingNeeds, type ChargingStation, type Component, type EventData, Evse, type Location, type SecurityEvent, type Variable, type VariableMonitoring } from '../layers/sequelize';
import { MessageInfo } from '../layers/sequelize';
import { Subscription } from '../layers/sequelize';
import { Tariff } from '../layers/sequelize';
import { TariffQueryString } from './queries/Tariff';
import { ChargingProfile } from '../layers/sequelize';

export interface IAuthorizationRepository extends CrudRepository<AuthorizationData> {
  createOrUpdateByQuerystring: (value: AuthorizationData, query: AuthorizationQuerystring) => Promise<Authorization | undefined>;
  updateRestrictionsByQuerystring: (value: AuthorizationRestrictions, query: AuthorizationQuerystring) => Promise<Authorization[]>;
  readAllByQuerystring: (query: AuthorizationQuerystring) => Promise<Authorization[]>;
  readOnlyOneByQuerystring: (query: AuthorizationQuerystring) => Promise<Authorization | undefined>;
  existByQuerystring: (query: AuthorizationQuerystring) => Promise<number>;
  deleteAllByQuerystring: (query: AuthorizationQuerystring) => Promise<Authorization[]>;
}

/**
 * Key is StationId
 */
export interface IBootRepository extends CrudRepository<BootConfig> {
  createOrUpdateByKey: (value: BootConfig, key: string) => Promise<Boot | undefined>;
  updateStatusByKey: (status: RegistrationStatusEnumType, statusInfo: StatusInfoType | undefined, key: string) => Promise<Boot | undefined>;
  updateLastBootTimeByKey: (lastBootTime: string, key: string) => Promise<Boot | undefined>;
  readByKey: (key: string) => Promise<Boot | undefined>;
  existsByKey: (key: string) => Promise<boolean>;
  deleteByKey: (key: string) => Promise<Boot | undefined>;
}

export interface IDeviceModelRepository extends CrudRepository<VariableAttributeType> {
  createOrUpdateDeviceModelByStationId(value: ReportDataType, stationId: string, isoTimestamp: string): Promise<VariableAttribute[]>;
  createOrUpdateByGetVariablesResultAndStationId(getVariablesResult: GetVariableResultType[], stationId: string, isoTimestamp: string): Promise<VariableAttribute[]>;
  createOrUpdateBySetVariablesDataAndStationId(setVariablesData: SetVariableDataType[], stationId: string, isoTimestamp: string): Promise<VariableAttribute[]>;
  updateResultByStationId(result: SetVariableResultType, stationId: string, isoTimestamp: string): Promise<VariableAttribute | undefined>;
  readAllSetVariableByStationId(stationId: string): Promise<SetVariableDataType[]>;
  readAllByQuerystring(query: VariableAttributeQuerystring): Promise<VariableAttribute[]>;
  existByQuerystring(query: VariableAttributeQuerystring): Promise<number>;
  deleteAllByQuerystring(query: VariableAttributeQuerystring): Promise<VariableAttribute[]>;
  findComponentAndVariable(componentType: ComponentType, variableType: VariableType): Promise<[Component | undefined, Variable | undefined]>;
  findOrCreateEvseAndComponentAndVariable(componentType: ComponentType, variableType: VariableType): Promise<[Component, Variable]>;
  findOrCreateEvseAndComponent(componentType: ComponentType, stationId: string): Promise<Component>;
  findEvseByIdAndConnectorId(id: number, connectorId: number | null): Promise<Evse | undefined>;
  findVariableCharacteristicsByVariableNameAndVariableInstance(variableName: string, variableInstance: string | null): Promise<VariableCharacteristics | undefined>;
}

export interface ILocationRepository extends CrudRepository<Location> {
  readLocationById: (id: number) => Promise<Location | undefined>;
  readChargingStationByStationId: (stationId: string) => Promise<ChargingStation | undefined>;
  addStatusNotificationToChargingStation(stationId: string, statusNotification: StatusNotificationRequest): Promise<void>;
}

export interface ISecurityEventRepository extends CrudRepository<SecurityEvent> {
  createByStationId: (value: SecurityEventNotificationRequest, stationId: string) => Promise<SecurityEvent>;
  readByStationIdAndTimestamps: (stationId: string, from?: Date, to?: Date) => Promise<SecurityEvent[]>;
  deleteByKey: (key: string) => Promise<SecurityEvent | undefined>;
}

export interface ISubscriptionRepository extends CrudRepository<Subscription> {
  create(value: Subscription): Promise<Subscription>;
  readAllByStationId(stationId: string): Promise<Subscription[]>;
  deleteByKey(key: string): Promise<Subscription | undefined>;
}

export interface ITransactionEventRepository extends CrudRepository<TransactionEventRequest> {
  createOrUpdateTransactionByTransactionEventAndStationId(value: TransactionEventRequest, stationId: string): Promise<Transaction>;
  readAllByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<TransactionEventRequest[]>;
  readTransactionByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<Transaction | undefined>;
  readAllTransactionsByStationIdAndEvseAndChargingStates(stationId: string, evse: EVSEType, chargingStates?: ChargingStateEnumType[]): Promise<Transaction[]>;
  readAllActiveTransactionsByIdToken(idToken: IdTokenType): Promise<Transaction[]>;
  readAllMeterValuesByTransactionDataBaseId(transactionDataBaseId: number): Promise<MeterValue[]>;
}

export interface IVariableMonitoringRepository extends CrudRepository<VariableMonitoringType> {
  createOrUpdateByMonitoringDataTypeAndStationId(value: MonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring[]>;
  createOrUpdateBySetMonitoringDataTypeAndStationId(value: SetMonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring>;
  rejectAllVariableMonitoringsByStationId(action: CallAction, stationId: string): Promise<void>;
  rejectVariableMonitoringByIdAndStationId(action: CallAction, id: number, stationId: string): Promise<void>;
  updateResultByStationId(result: SetMonitoringResultType, stationId: string): Promise<VariableMonitoring>;
  createEventDatumByComponentIdAndVariableIdAndStationId(event: EventDataType, componentId: string, variableId: string, stationId: string): Promise<EventData>;
}

export interface IMessageInfoRepository extends CrudRepository<MessageInfoType> {
  deactivateAllByStationId(stationId: string): Promise<void>;
  createOrUpdateByMessageInfoTypeAndStationId(value: MessageInfoType, stationId: string, componentId?: number): Promise<MessageInfo>;
}

export interface ITariffRepository extends CrudRepository<Tariff> {
  findByStationId(stationId: string): Promise<Tariff | undefined>;
  readAllByQuerystring(query: TariffQueryString): Promise<Tariff[]>;
  deleteAllByQuerystring(query: TariffQueryString): Promise<Tariff[]>;
  upsertTariff(tariff: Tariff): Promise<Tariff>;
}

export interface ICertificateRepository extends CrudRepository<Certificate> {
  createOrUpdateCertificate(certificate: Certificate): Promise<Certificate>;
}

export interface IChargingProfileRepository extends CrudRepository<ChargingProfile> {
  createOrUpdateChargingProfile(chargingProfile: ChargingProfileType, stationId: string, evseId?: number, chargingLimitSource?: ChargingLimitSourceEnumType, isActive?: boolean): Promise<ChargingProfile>;
  createChargingNeeds(chargingNeeds: NotifyEVChargingNeedsRequest, stationId: string): Promise<ChargingNeeds>;
  findChargingNeedsByEvseDBIdAndTransactionDBId(evseDBId: number, transactionDataBaseId: number): Promise<ChargingNeeds | undefined>;
  createCompositeSchedule(compositeSchedule: CompositeScheduleType, stationId: string): Promise<CompositeSchedule>;
}
