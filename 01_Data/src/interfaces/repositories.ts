// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  type BootConfig,
  type CallAction,
  ChargingStationSequenceType,
  type CrudRepository,
  OCPP1_6,
  OCPP2_0_1,
  OCPPVersion,
} from '@citrineos/base';
import { type AuthorizationQuerystring } from './queries/Authorization';
import {
  type Authorization,
  type Boot,
  type Certificate,
  ChangeConfiguration,
  ChargingNeeds,
  ChargingProfile,
  type ChargingStation,
  ChargingStationSecurityInfo,
  ChargingStationSequence,
  type Component,
  CompositeSchedule,
  Connector,
  type EventData,
  Evse,
  InstalledCertificate,
  LocalListVersion,
  type Location,
  MessageInfo,
  MeterValue,
  OCPPMessage,
  Reservation,
  type SecurityEvent,
  SendLocalList,
  ServerNetworkProfile,
  StatusNotification,
  StopTransaction,
  Subscription,
  Tariff,
  Tenant,
  type Transaction,
  TransactionEvent,
  type Variable,
  type VariableAttribute,
  VariableCharacteristics,
  type VariableMonitoring,
} from '../layers/sequelize';
import { type VariableAttributeQuerystring } from '.';
import { TariffQueryString } from './queries/Tariff';

export interface IAuthorizationRepository extends CrudRepository<Authorization> {
  readAllByQuerystring: (
    tenantId: number,
    query: AuthorizationQuerystring,
  ) => Promise<Authorization[]>;
  readOnlyOneByQuerystring: (
    tenantId: number,
    query: AuthorizationQuerystring,
  ) => Promise<Authorization | undefined>;
}

/**
 * Key is StationId
 */
export interface IBootRepository extends CrudRepository<BootConfig> {
  createOrUpdateByKey: (
    tenantId: number,
    value: BootConfig,
    key: string,
  ) => Promise<Boot | undefined>;
  updateStatusByKey: (
    tenantId: number,
    status: OCPP2_0_1.RegistrationStatusEnumType,
    statusInfo: OCPP2_0_1.StatusInfoType | undefined,
    key: string,
  ) => Promise<Boot | undefined>;
  updateLastBootTimeByKey: (
    tenantId: number,
    lastBootTime: string,
    key: string,
  ) => Promise<Boot | undefined>;
  readByKey: (tenantId: number, key: string) => Promise<Boot | undefined>;
  existsByKey: (tenantId: number, key: string) => Promise<boolean>;
  deleteByKey: (tenantId: number, key: string) => Promise<Boot | undefined>;
}

export interface IDeviceModelRepository extends CrudRepository<OCPP2_0_1.VariableAttributeType> {
  createOrUpdateDeviceModelByStationId(
    tenantId: number,
    value: OCPP2_0_1.ReportDataType,
    stationId: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]>;
  createOrUpdateByGetVariablesResultAndStationId(
    tenantId: number,
    getVariablesResult: OCPP2_0_1.GetVariableResultType[],
    stationId: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]>;
  createOrUpdateBySetVariablesDataAndStationId(
    tenantId: number,
    setVariablesData: OCPP2_0_1.SetVariableDataType[],
    stationId: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]>;
  updateResultByStationId(
    tenantId: number,
    result: OCPP2_0_1.SetVariableResultType,
    stationId: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute | undefined>;
  readAllSetVariableByStationId(
    tenantId: number,
    stationId: string,
  ): Promise<OCPP2_0_1.SetVariableDataType[]>;
  readAllByQuerystring(
    tenantId: number,
    query: VariableAttributeQuerystring,
  ): Promise<VariableAttribute[]>;
  existByQuerystring(tenantId: number, query: VariableAttributeQuerystring): Promise<number>;
  deleteAllByQuerystring(
    tenantId: number,
    query: VariableAttributeQuerystring,
  ): Promise<VariableAttribute[]>;
  findComponentAndVariable(
    tenantId: number,
    componentType: OCPP2_0_1.ComponentType,
    variableType: OCPP2_0_1.VariableType,
  ): Promise<[Component | undefined, Variable | undefined]>;
  findOrCreateEvseAndComponentAndVariable(
    tenantId: number,
    componentType: OCPP2_0_1.ComponentType,
    variableType: OCPP2_0_1.VariableType,
  ): Promise<[Component, Variable]>;
  findOrCreateEvseAndComponent(
    tenantId: number,
    componentType: OCPP2_0_1.ComponentType,
    stationId: string,
  ): Promise<Component>;
  findEvseByIdAndConnectorId(
    tenantId: number,
    id: number,
    connectorId: number | null,
  ): Promise<Evse | undefined>;
  findVariableCharacteristicsByVariableNameAndVariableInstance(
    tenantId: number,
    variableName: string,
    variableInstance: string | null,
  ): Promise<VariableCharacteristics | undefined>;
}

export interface ILocalAuthListRepository extends CrudRepository<LocalListVersion> {
  /**
   * Creates a SendLocalList.
   * @param {number} tenantId - The tenant ID.
   * @param {string} stationId - The ID of the station.
   * @param {string} correlationId - The correlation ID.
   * @param {UpdateEnumType} updateType - The type of update.
   * @param {number} versionNumber - The version number.
   * @param {AuthorizationData[]} localAuthorizationList - The list of authorizations.
   * @return {SendLocalList} The database object. Contains the correlationId to be used for the sendLocalListRequest.
   */
  createSendLocalListFromRequestData(
    tenantId: number,
    stationId: string,
    correlationId: string,
    updateType: OCPP2_0_1.UpdateEnumType,
    versionNumber: number,
    localAuthorizationList?: OCPP2_0_1.AuthorizationData[],
  ): Promise<SendLocalList>;
  /**
   * Used to process GetLocalListVersionResponse, if version is unknown it will create or update LocalListVersion with the new version and an empty localAuthorizationList.
   * @param tenantId
   * @param versionNumber
   * @param stationId
   */
  validateOrReplaceLocalListVersionForStation(
    tenantId: number,
    versionNumber: number,
    stationId: string,
  ): Promise<void>;
  getSendLocalListRequestByStationIdAndCorrelationId(
    tenantId: number,
    stationId: string,
    correlationId: string,
  ): Promise<SendLocalList | undefined>;
  /**
   * Used to process SendLocalListResponse.
   * @param tenantId
   * @param stationId
   * @param {SendLocalList} sendLocalList - The SendLocalList object created from the associated SendLocalListRequest.
   * @returns {LocalListVersion} LocalListVersion - The updated LocalListVersion.
   */
  createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
    tenantId: number,
    stationId: string,
    sendLocalList: SendLocalList,
  ): Promise<LocalListVersion>;
}

export interface ILocationRepository extends CrudRepository<Location> {
  readLocationById: (tenantId: number, id: number) => Promise<Location | undefined>;
  readChargingStationByStationId: (
    tenantId: number,
    stationId: string,
  ) => Promise<ChargingStation | undefined>;
  setChargingStationIsOnlineAndOCPPVersion: (
    tenantId: number,
    stationId: string,
    isOnline: boolean,
    ocppVersion: OCPPVersion | null,
  ) => Promise<ChargingStation | undefined>;
  doesChargingStationExistByStationId: (tenantId: number, stationId: string) => Promise<boolean>;
  addStatusNotificationToChargingStation(
    tenantId: number,
    stationId: string,
    statusNotification: StatusNotification,
  ): Promise<void>;
  createOrUpdateChargingStation(
    tenantId: number,
    chargingStation: ChargingStation,
  ): Promise<ChargingStation>;
  createOrUpdateConnector(tenantId: number, connector: Connector): Promise<Connector | undefined>;
}

export interface ISecurityEventRepository extends CrudRepository<SecurityEvent> {
  createByStationId: (
    tenantId: number,
    value: OCPP2_0_1.SecurityEventNotificationRequest,
    stationId: string,
  ) => Promise<SecurityEvent>;
  readByStationIdAndTimestamps: (
    tenantId: number,
    stationId: string,
    from?: Date,
    to?: Date,
  ) => Promise<SecurityEvent[]>;
  deleteByKey: (tenantId: number, key: string) => Promise<SecurityEvent | undefined>;
}

export interface ISubscriptionRepository extends CrudRepository<Subscription> {
  create(tenantId: number, value: Subscription): Promise<Subscription>;
  readAllByStationId(tenantId: number, stationId: string): Promise<Subscription[]>;
  deleteByKey(tenantId: number, key: string): Promise<Subscription | undefined>;
}

export interface ITransactionEventRepository extends CrudRepository<TransactionEvent> {
  createOrUpdateTransactionByTransactionEventAndStationId(
    tenantId: number,
    value: OCPP2_0_1.TransactionEventRequest,
    stationId: string,
  ): Promise<Transaction>;
  createMeterValue(
    tenantId: number,
    value: OCPP2_0_1.MeterValueType,
    transactionDatabaseId?: number | null,
  ): Promise<void>;
  createTransactionByStartTransaction(
    tenantId: number,
    request: OCPP1_6.StartTransactionRequest,
    stationId: string,
  ): Promise<Transaction>;
  updateTransactionByMeterValues(
    tenantId: number,
    meterValues: MeterValue[],
    stationId: string,
    transactionId: number,
  ): Promise<void>;
  readAllByStationIdAndTransactionId(
    tenantId: number,
    stationId: string,
    transactionId: string,
  ): Promise<TransactionEvent[]>;
  readTransactionByStationIdAndTransactionId(
    tenantId: number,
    stationId: string,
    transactionId: string,
  ): Promise<Transaction | undefined>;
  readAllTransactionsByStationIdAndEvseAndChargingStates(
    tenantId: number,
    stationId: string,
    evse: OCPP2_0_1.EVSEType,
    chargingStates?: OCPP2_0_1.ChargingStateEnumType[],
  ): Promise<Transaction[]>;
  readAllActiveTransactionsIncludeTransactionEventByIdToken(
    tenantId: number,
    idToken: OCPP2_0_1.IdTokenType,
  ): Promise<Transaction[]>;
  readAllActiveTransactionsIncludeStartTransactionByIdToken(
    tenantId: number,
    idToken: string,
  ): Promise<Transaction[]>;
  readAllMeterValuesByTransactionDataBaseId(
    tenantId: number,
    transactionDataBaseId: number,
  ): Promise<MeterValue[]>;
  getActiveTransactionByStationIdAndEvseId(
    tenantId: number,
    stationId: string,
    evseId: number,
  ): Promise<Transaction | undefined>;
  updateTransactionTotalCostById(tenantId: number, totalCost: number, id: number): Promise<void>;
  createStopTransaction(
    tenantId: number,
    transactionDatabaseId: number,
    stationId: string,
    meterStop: number,
    timestamp: Date,
    meterValues: MeterValue[],
    reason?: string,
    idTokenDatabaseId?: number,
  ): Promise<StopTransaction>;
  updateTransactionByStationIdAndTransactionId(
    tenantId: number,
    transaction: Partial<Transaction>,
    transactionId: string,
    stationId: string,
  ): Promise<Transaction | undefined>;
}

export interface IVariableMonitoringRepository
  extends CrudRepository<OCPP2_0_1.VariableMonitoringType> {
  createOrUpdateByMonitoringDataTypeAndStationId(
    tenantId: number,
    value: OCPP2_0_1.MonitoringDataType,
    componentId: string,
    variableId: string,
    stationId: string,
  ): Promise<VariableMonitoring[]>;
  createOrUpdateBySetMonitoringDataTypeAndStationId(
    tenantId: number,
    value: OCPP2_0_1.SetMonitoringDataType,
    componentId: string,
    variableId: string,
    stationId: string,
  ): Promise<VariableMonitoring>;
  rejectAllVariableMonitoringsByStationId(
    tenantId: number,
    action: CallAction,
    stationId: string,
  ): Promise<void>;
  rejectVariableMonitoringByIdAndStationId(
    tenantId: number,
    action: CallAction,
    id: number,
    stationId: string,
  ): Promise<void>;
  updateResultByStationId(
    tenantId: number,
    result: OCPP2_0_1.SetMonitoringResultType,
    stationId: string,
  ): Promise<VariableMonitoring>;
  createEventDatumByComponentIdAndVariableIdAndStationId(
    tenantId: number,
    event: OCPP2_0_1.EventDataType,
    componentId: string,
    variableId: string,
    stationId: string,
  ): Promise<EventData>;
}

export interface IMessageInfoRepository extends CrudRepository<OCPP2_0_1.MessageInfoType> {
  deactivateAllByStationId(tenantId: number, stationId: string): Promise<void>;
  createOrUpdateByMessageInfoTypeAndStationId(
    tenantId: number,
    value: OCPP2_0_1.MessageInfoType,
    stationId: string,
    componentId?: number,
  ): Promise<MessageInfo>;
}

export interface ITariffRepository extends CrudRepository<Tariff> {
  findByStationId(tenantId: number, stationId: string): Promise<Tariff | undefined>;
  readAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<Tariff[]>;
  deleteAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<Tariff[]>;
  upsertTariff(tenantId: number, tariff: Tariff): Promise<Tariff>;
}

export interface ICertificateRepository extends CrudRepository<Certificate> {
  createOrUpdateCertificate(tenantId: number, certificate: Certificate): Promise<Certificate>;
}

export interface IInstalledCertificateRepository extends CrudRepository<InstalledCertificate> {}

export interface IChargingProfileRepository extends CrudRepository<ChargingProfile> {
  createOrUpdateChargingProfile(
    tenantId: number,
    chargingProfile: OCPP2_0_1.ChargingProfileType,
    stationId: string,
    evseId?: number | null,
    chargingLimitSource?: OCPP2_0_1.ChargingLimitSourceEnumType,
    isActive?: boolean,
  ): Promise<ChargingProfile>;
  createChargingNeeds(
    tenantId: number,
    chargingNeeds: OCPP2_0_1.NotifyEVChargingNeedsRequest,
    stationId: string,
  ): Promise<ChargingNeeds>;
  findChargingNeedsByEvseDBIdAndTransactionDBId(
    tenantId: number,
    evseDBId: number,
    transactionDataBaseId: number,
  ): Promise<ChargingNeeds | undefined>;
  createCompositeSchedule(
    tenantId: number,
    compositeSchedule: OCPP2_0_1.CompositeScheduleType,
    stationId: string,
  ): Promise<CompositeSchedule>;
  getNextChargingProfileId(tenantId: number, stationId: string): Promise<number>;
  getNextChargingScheduleId(tenantId: number, stationId: string): Promise<number>;
  getNextStackLevel(
    tenantId: number,
    stationId: string,
    transactionDatabaseId: number | null,
    profilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType,
  ): Promise<number>;
}

export interface IReservationRepository extends CrudRepository<Reservation> {
  createOrUpdateReservation(
    tenantId: number,
    reserveNowRequest: OCPP2_0_1.ReserveNowRequest,
    stationId: string,
    isActive?: boolean,
  ): Promise<Reservation | undefined>;
}

export interface IOCPPMessageRepository extends CrudRepository<OCPPMessage> {}

export interface IChargingStationSecurityInfoRepository
  extends CrudRepository<ChargingStationSecurityInfo> {
  readChargingStationPublicKeyFileId(tenantId: number, stationId: string): Promise<string>;
  readOrCreateChargingStationInfo(
    tenantId: number,
    stationId: string,
    publicKeyFileId: string,
  ): Promise<void>;
}

export interface IChargingStationSequenceRepository
  extends CrudRepository<ChargingStationSequence> {
  getNextSequenceValue(
    tenantId: number,
    stationId: string,
    type: ChargingStationSequenceType,
  ): Promise<number>;
}

export interface IServerNetworkProfileRepository extends CrudRepository<ServerNetworkProfile> {}

export interface IChangeConfigurationRepository extends CrudRepository<ChangeConfiguration> {
  createOrUpdateChangeConfiguration(
    tenantId: number,
    configuration: ChangeConfiguration,
  ): Promise<ChangeConfiguration | undefined>;
}

export interface ITenantRepository extends CrudRepository<Tenant> {}
