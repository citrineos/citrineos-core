// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  type AuthorizationData,
  type BootConfig,
  type CallAction,
  ChargingLimitSourceEnumType,
  ChargingProfilePurposeEnumType,
  ChargingProfileType,
  type ChargingStateEnumType,
  ChargingStationSequenceType,
  type ComponentType,
  CompositeScheduleType,
  type CrudRepository,
  type EventDataType,
  type EVSEType,
  type GetVariableResultType,
  type IdTokenType,
  MessageInfoType,
  MeterValueType,
  type MonitoringDataType,
  NotifyEVChargingNeedsRequest,
  type RegistrationStatusEnumType,
  type ReportDataType,
  ReserveNowRequest,
  type SecurityEventNotificationRequest,
  type SetMonitoringDataType,
  type SetMonitoringResultType,
  type SetVariableDataType,
  type SetVariableResultType,
  type StatusInfoType,
  StatusNotificationRequest,
  type TransactionEventRequest,
  UpdateEnumType,
  type VariableAttributeType,
  type VariableMonitoringType,
  type VariableType,
} from '@citrineos/base';
import { type AuthorizationQuerystring } from './queries/Authorization';
import {
  type Authorization,
  type Boot,
  CallMessage,
  type Certificate,
  ChargingNeeds,
  ChargingProfile,
  type ChargingStation,
  ChargingStationSecurityInfo,
  ChargingStationSequence,
  type Component,
  CompositeSchedule,
  DeleteCertificateAttempt,
  type EventData,
  Evse,
  type Location,
  MessageInfo,
  MeterValue,
  Reservation,
  type SecurityEvent,
  ServerNetworkProfile,
  Subscription,
  Tariff,
  type Transaction,
  type Variable,
  type VariableAttribute,
  VariableCharacteristics,
  type VariableMonitoring,
} from '../layers/sequelize';
import { type AuthorizationRestrictions, type VariableAttributeQuerystring } from '.';
import { TariffQueryString } from './queries/Tariff';
import { LocalListVersion } from '../layers/sequelize/model/Authorization/LocalListVersion';
import { SendLocalList } from '../layers/sequelize/model/Authorization/SendLocalList';
import { InstalledCertificate } from '../layers/sequelize/model/Certificate/InstalledCertificate';
import { InstallCertificateAttempt } from '../layers/sequelize/model/Certificate/InstallCertificateAttempt';

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

export interface ILocalAuthListRepository extends CrudRepository<LocalListVersion> {
  /**
   * Creates a SendLocalList.
   * @param {string} stationId - The ID of the station.
   * @param {UpdateEnumType} updateType - The type of update.
   * @param {number} versionNumber - The version number.
   * @param {AuthorizationData[]} localAuthorizationList - The list of authorizations.
   * @return {SendLocalList} The database object. Contains the correlationId to be used for the sendLocalListRequest.
   */
  createSendLocalListFromRequestData(stationId: string, correlationId: string, updateType: UpdateEnumType, versionNumber: number, localAuthorizationList?: AuthorizationData[]): Promise<SendLocalList>;
  /**
   * Used to process GetLocalListVersionResponse, if version is unknown it will create or update LocalListVersion with the new version and an empty localAuthorizationList.
   * @param versionNumber
   * @param stationId
   */
  validateOrReplaceLocalListVersionForStation(versionNumber: number, stationId: string): Promise<void>;
  getSendLocalListRequestByStationIdAndCorrelationId(stationId: string, correlationId: string): Promise<SendLocalList | undefined>;
  /**
   * Used to process SendLocalListResponse.
   * @param stationId
   * @param {SendLocalList} sendLocalList - The SendLocalList object created from the associated SendLocalListRequest.
   * @returns {LocalListVersion} LocalListVersion - The updated LocalListVersion.
   */
  createOrUpdateLocalListVersionFromStationIdAndSendLocalList(stationId: string, sendLocalList: SendLocalList): Promise<LocalListVersion>;
}

export interface ILocationRepository extends CrudRepository<Location> {
  readLocationById: (id: number) => Promise<Location | undefined>;
  readChargingStationByStationId: (stationId: string) => Promise<ChargingStation | undefined>;
  setChargingStationIsOnline: (stationId: string, isOnline: boolean) => Promise<boolean>;
  doesChargingStationExistByStationId: (stationId: string) => Promise<boolean>;
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
  createMeterValue(value: MeterValueType): Promise<void>;
  readAllByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<TransactionEventRequest[]>;
  readTransactionByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<Transaction | undefined>;
  readAllTransactionsByStationIdAndEvseAndChargingStates(stationId: string, evse: EVSEType, chargingStates?: ChargingStateEnumType[]): Promise<Transaction[]>;
  readAllActiveTransactionsByIdToken(idToken: IdTokenType): Promise<Transaction[]>;
  readAllMeterValuesByTransactionDataBaseId(transactionDataBaseId: number): Promise<MeterValue[]>;
  getActiveTransactionByStationIdAndEvseId(stationId: string, evseId: number): Promise<Transaction | undefined>;
  updateTransactionTotalCostById(totalCost: number, id: number): Promise<void>;
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

export interface IInstalledCertificateRepository extends CrudRepository<InstalledCertificate> {}
export interface IInstallCertificateAttemptRepository extends CrudRepository<InstallCertificateAttempt> {}
export interface IDeleteCertificateAttemptRepository extends CrudRepository<DeleteCertificateAttempt> {}

export interface IChargingProfileRepository extends CrudRepository<ChargingProfile> {
  createOrUpdateChargingProfile(chargingProfile: ChargingProfileType, stationId: string, evseId?: number | null, chargingLimitSource?: ChargingLimitSourceEnumType, isActive?: boolean): Promise<ChargingProfile>;
  createChargingNeeds(chargingNeeds: NotifyEVChargingNeedsRequest, stationId: string): Promise<ChargingNeeds>;
  findChargingNeedsByEvseDBIdAndTransactionDBId(evseDBId: number, transactionDataBaseId: number): Promise<ChargingNeeds | undefined>;
  createCompositeSchedule(compositeSchedule: CompositeScheduleType, stationId: string): Promise<CompositeSchedule>;
  getNextChargingProfileId(stationId: string): Promise<number>;
  getNextChargingScheduleId(stationId: string): Promise<number>;
  getNextStackLevel(stationId: string, transactionDatabaseId: number | null, profilePurpose: ChargingProfilePurposeEnumType): Promise<number>;
}

export interface IReservationRepository extends CrudRepository<Reservation> {
  createOrUpdateReservation(reserveNowRequest: ReserveNowRequest, stationId: string, isActive?: boolean): Promise<Reservation | undefined>;
}

export interface ICallMessageRepository extends CrudRepository<CallMessage> {}

export interface IChargingStationSecurityInfoRepository extends CrudRepository<ChargingStationSecurityInfo> {
  readChargingStationPublicKeyFileId(stationId: string): Promise<string>;
  readOrCreateChargingStationInfo(stationId: string, publicKeyFileId: string): Promise<void>;
}

export interface IChargingStationSequenceRepository extends CrudRepository<ChargingStationSequence> {
  getNextSequenceValue(stationId: string, type: ChargingStationSequenceType): Promise<number>;
}

export interface IServerNetworkProfileRepository extends CrudRepository<ServerNetworkProfile> {}
