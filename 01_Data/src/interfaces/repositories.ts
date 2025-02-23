// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type BootConfig, type CallAction, ChargingStationSequenceType, type CrudRepository, OCPP2_0_1, OCPP1_6 } from '@citrineos/base';
import { type AuthorizationQuerystring } from './queries/Authorization';
import {
  type Authorization,
  type Boot,
  type Certificate,
  ChargingNeeds,
  ChargingProfile,
  type ChargingStation,
  ChargingStationSecurityInfo,
  ChargingStationSequence,
  type Component,
  CompositeSchedule,
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
  TransactionEvent,
  StatusNotification,
  Connector,
  LocalListVersion,
  SendLocalList,
  InstalledCertificate,
  ChangeConfiguration,
  OCPPMessage,
} from '../layers/sequelize';
import { type AuthorizationRestrictions, type VariableAttributeQuerystring } from '.';
import { TariffQueryString } from './queries/Tariff';

export interface IAuthorizationRepository extends CrudRepository<Authorization> {
  createOrUpdateByQuerystring: (value: OCPP2_0_1.AuthorizationData, query: AuthorizationQuerystring) => Promise<Authorization | undefined>;
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
  updateStatusByKey: (status: OCPP2_0_1.RegistrationStatusEnumType, statusInfo: OCPP2_0_1.StatusInfoType | undefined, key: string) => Promise<Boot | undefined>;
  updateLastBootTimeByKey: (lastBootTime: string, key: string) => Promise<Boot | undefined>;
  readByKey: (key: string) => Promise<Boot | undefined>;
  existsByKey: (key: string) => Promise<boolean>;
  deleteByKey: (key: string) => Promise<Boot | undefined>;
}

export interface IDeviceModelRepository extends CrudRepository<OCPP2_0_1.VariableAttributeType> {
  createOrUpdateDeviceModelByStationId(value: OCPP2_0_1.ReportDataType, stationId: string, isoTimestamp: string): Promise<VariableAttribute[]>;
  createOrUpdateByGetVariablesResultAndStationId(getVariablesResult: OCPP2_0_1.GetVariableResultType[], stationId: string, isoTimestamp: string): Promise<VariableAttribute[]>;
  createOrUpdateBySetVariablesDataAndStationId(setVariablesData: OCPP2_0_1.SetVariableDataType[], stationId: string, isoTimestamp: string): Promise<VariableAttribute[]>;
  updateResultByStationId(result: OCPP2_0_1.SetVariableResultType, stationId: string, isoTimestamp: string): Promise<VariableAttribute | undefined>;
  readAllSetVariableByStationId(stationId: string): Promise<OCPP2_0_1.SetVariableDataType[]>;
  readAllByQuerystring(query: VariableAttributeQuerystring): Promise<VariableAttribute[]>;
  existByQuerystring(query: VariableAttributeQuerystring): Promise<number>;
  deleteAllByQuerystring(query: VariableAttributeQuerystring): Promise<VariableAttribute[]>;
  findComponentAndVariable(componentType: OCPP2_0_1.ComponentType, variableType: OCPP2_0_1.VariableType): Promise<[Component | undefined, Variable | undefined]>;
  findOrCreateEvseAndComponentAndVariable(componentType: OCPP2_0_1.ComponentType, variableType: OCPP2_0_1.VariableType): Promise<[Component, Variable]>;
  findOrCreateEvseAndComponent(componentType: OCPP2_0_1.ComponentType, stationId: string): Promise<Component>;
  findEvseByIdAndConnectorId(id: number, connectorId: number | null): Promise<Evse | undefined>;
  findVariableCharacteristicsByVariableNameAndVariableInstance(variableName: string, variableInstance: string | null): Promise<VariableCharacteristics | undefined>;
}

export interface ILocalAuthListRepository extends CrudRepository<LocalListVersion> {
  /**
   * Creates a SendLocalList.
   * @param {string} stationId - The ID of the station.
   * @param {string} correlationId - The correlation ID.
   * @param {UpdateEnumType} updateType - The type of update.
   * @param {number} versionNumber - The version number.
   * @param {AuthorizationData[]} localAuthorizationList - The list of authorizations.
   * @return {SendLocalList} The database object. Contains the correlationId to be used for the sendLocalListRequest.
   */
  createSendLocalListFromRequestData(stationId: string, correlationId: string, updateType: OCPP2_0_1.UpdateEnumType, versionNumber: number, localAuthorizationList?: OCPP2_0_1.AuthorizationData[]): Promise<SendLocalList>;
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
  addStatusNotificationToChargingStation(stationId: string, statusNotification: StatusNotification): Promise<void>;
  createOrUpdateChargingStation(chargingStation: ChargingStation): Promise<ChargingStation>;
  createOrUpdateConnector(connector: Connector): Promise<Connector | undefined>;
}

export interface ISecurityEventRepository extends CrudRepository<SecurityEvent> {
  createByStationId: (value: OCPP2_0_1.SecurityEventNotificationRequest, stationId: string) => Promise<SecurityEvent>;
  readByStationIdAndTimestamps: (stationId: string, from?: Date, to?: Date) => Promise<SecurityEvent[]>;
  deleteByKey: (key: string) => Promise<SecurityEvent | undefined>;
}

export interface ISubscriptionRepository extends CrudRepository<Subscription> {
  create(value: Subscription): Promise<Subscription>;
  readAllByStationId(stationId: string): Promise<Subscription[]>;
  deleteByKey(key: string): Promise<Subscription | undefined>;
}

export interface ITransactionEventRepository extends CrudRepository<TransactionEvent> {
  createOrUpdateTransactionByTransactionEventAndStationId(value: OCPP2_0_1.TransactionEventRequest, stationId: string): Promise<Transaction>;
  createMeterValue(value: OCPP2_0_1.MeterValueType, transactionDatabaseId?: number | null): Promise<void>;
  updateTransactionByMeterValues(meterValues: MeterValue[], stationId: string, transactionId: number): Promise<void>;
  readAllByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<TransactionEvent[]>;
  readTransactionByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<Transaction | undefined>;
  readAllTransactionsByStationIdAndEvseAndChargingStates(stationId: string, evse: OCPP2_0_1.EVSEType, chargingStates?: OCPP2_0_1.ChargingStateEnumType[]): Promise<Transaction[]>;
  readAllActiveTransactionsByIdToken(idToken: OCPP2_0_1.IdTokenType): Promise<Transaction[]>;
  readAllMeterValuesByTransactionDataBaseId(transactionDataBaseId: number): Promise<MeterValue[]>;
  getActiveTransactionByStationIdAndEvseId(stationId: string, evseId: number): Promise<Transaction | undefined>;
  updateTransactionTotalCostById(totalCost: number, id: number): Promise<void>;
}

export interface IVariableMonitoringRepository extends CrudRepository<OCPP2_0_1.VariableMonitoringType> {
  createOrUpdateByMonitoringDataTypeAndStationId(value: OCPP2_0_1.MonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring[]>;
  createOrUpdateBySetMonitoringDataTypeAndStationId(value: OCPP2_0_1.SetMonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring>;
  rejectAllVariableMonitoringsByStationId(action: CallAction, stationId: string): Promise<void>;
  rejectVariableMonitoringByIdAndStationId(action: CallAction, id: number, stationId: string): Promise<void>;
  updateResultByStationId(result: OCPP2_0_1.SetMonitoringResultType, stationId: string): Promise<VariableMonitoring>;
  createEventDatumByComponentIdAndVariableIdAndStationId(event: OCPP2_0_1.EventDataType, componentId: string, variableId: string, stationId: string): Promise<EventData>;
}

export interface IMessageInfoRepository extends CrudRepository<OCPP2_0_1.MessageInfoType> {
  deactivateAllByStationId(stationId: string): Promise<void>;
  createOrUpdateByMessageInfoTypeAndStationId(value: OCPP2_0_1.MessageInfoType, stationId: string, componentId?: number): Promise<MessageInfo>;
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

export interface IChargingProfileRepository extends CrudRepository<ChargingProfile> {
  createOrUpdateChargingProfile(chargingProfile: OCPP2_0_1.ChargingProfileType, stationId: string, evseId?: number | null, chargingLimitSource?: OCPP2_0_1.ChargingLimitSourceEnumType, isActive?: boolean): Promise<ChargingProfile>;
  createChargingNeeds(chargingNeeds: OCPP2_0_1.NotifyEVChargingNeedsRequest, stationId: string): Promise<ChargingNeeds>;
  findChargingNeedsByEvseDBIdAndTransactionDBId(evseDBId: number, transactionDataBaseId: number): Promise<ChargingNeeds | undefined>;
  createCompositeSchedule(compositeSchedule: OCPP2_0_1.CompositeScheduleType, stationId: string): Promise<CompositeSchedule>;
  getNextChargingProfileId(stationId: string): Promise<number>;
  getNextChargingScheduleId(stationId: string): Promise<number>;
  getNextStackLevel(stationId: string, transactionDatabaseId: number | null, profilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType): Promise<number>;
}

export interface IReservationRepository extends CrudRepository<Reservation> {
  createOrUpdateReservation(reserveNowRequest: OCPP2_0_1.ReserveNowRequest, stationId: string, isActive?: boolean): Promise<Reservation | undefined>;
}

export interface IOCPPMessageRepository extends CrudRepository<OCPPMessage> {}

export interface IChargingStationSecurityInfoRepository extends CrudRepository<ChargingStationSecurityInfo> {
  readChargingStationPublicKeyFileId(stationId: string): Promise<string>;
  readOrCreateChargingStationInfo(stationId: string, publicKeyFileId: string): Promise<void>;
}

export interface IChargingStationSequenceRepository extends CrudRepository<ChargingStationSequence> {
  getNextSequenceValue(stationId: string, type: ChargingStationSequenceType): Promise<number>;
}

export interface IServerNetworkProfileRepository extends CrudRepository<ServerNetworkProfile> {}

export interface IChangeConfigurationRepository extends CrudRepository<ChangeConfiguration> {
  updateStatusByStationIdAndKey(stationId: string, key: string, status: OCPP1_6.ChangeConfigurationResponseStatus): Promise<ChangeConfiguration | undefined>;
  createOrUpdateChangeConfiguration(configuration: ChangeConfiguration): Promise<ChangeConfiguration | undefined>;
}
