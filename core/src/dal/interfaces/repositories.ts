// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  BootConfig,
  CallAction,
  ChargingStationSequenceTypeEnumType,
  CrudRepository,
  MeterValueDto,
  OCPP1_6,
  OCPPVersion,
  ChargingLimitSourceEnumType,
  ChargingProfilePurposeEnumType,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPPMessageDto,
  RegistrationStatusEnumType,
  UpdateEnumType,
  ChargingStateEnumType,
} from '@citrineos/base';
import type {
  ChargingProfileInput,
  CompositeScheduleInput,
} from '../layers/sequelize/mapper/2.0.1/ChargingProfileMapper.js';
import type { Authorization } from '../layers/sequelize/model/Authorization/Authorization.js';
import type { Boot } from '../layers/sequelize/model/Boot.js';
import type { Certificate } from '../layers/sequelize/model/Certificate/Certificate.js';
import type { ChargingStation } from '../layers/sequelize/model/Location/ChargingStation.js';
import type { Component } from '../layers/sequelize/model/DeviceModel/Component.js';
import type { Variable } from '../layers/sequelize/model/DeviceModel/Variable.js';
import type {
  EventData,
  VariableMonitoring,
} from '../layers/sequelize/model/VariableMonitoring/index.js';
import type { Location } from '../layers/sequelize/model/Location/Location.js';
import type { SecurityEvent } from '../layers/sequelize/model/SecurityEvent.js';
import type { Transaction } from '../layers/sequelize/model/TransactionEvent/index.js';
import type { VariableAttribute } from '../layers/sequelize/model/DeviceModel/VariableAttribute.js';
import type { ChangeConfiguration } from '../layers/sequelize/model/ChangeConfiguration.js';
import type {
  ChargingNeeds,
  ChargingProfile,
  CompositeSchedule,
} from '../layers/sequelize/model/ChargingProfile/index.js';
import type { ChargingStationSecurityInfo } from '../layers/sequelize/model/ChargingStationSecurityInfo.js';
import type { ChargingStationSequence } from '../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.js';
import type { Connector } from '../layers/sequelize/model/Location/Connector.js';
import type { Evse } from '../layers/sequelize/model/Location/Evse.js';
import type {
  DeleteCertificateAttempt,
  InstallCertificateAttempt,
  InstalledCertificate,
} from '../layers/sequelize/model/Certificate/index.js';
import type { EvseType } from '../layers/sequelize/model/DeviceModel/EvseType.js';
import type { LocalListVersion } from '../layers/sequelize/model/Authorization/LocalListVersion.js';
import type { SendLocalList } from '../layers/sequelize/model/Authorization/SendLocalList.js';
import type { MessageInfo } from '../layers/sequelize/model/MessageInfo/MessageInfo.js';
import type {
  MeterValue,
  StopTransaction,
} from '../layers/sequelize/model/TransactionEvent/index.js';
import type { OCPPMessage } from '../layers/sequelize/model/OCPPMessage.js';
import type { Reservation } from '../layers/sequelize/model/Reservation.js';
import type { ServerNetworkProfile } from '../layers/sequelize/model/Location/ServerNetworkProfile.js';
import type { StatusNotification } from '../layers/sequelize/model/Location/StatusNotification.js';
import type { Subscription } from '../layers/sequelize/model/Subscription/Subscription.js';
import type { Tariff } from '../layers/sequelize/model/Tariff/Tariffs.js';
import type { Tenant } from '../layers/sequelize/model/Tenant.js';
import type { TransactionEvent } from '../layers/sequelize/model/TransactionEvent/TransactionEvent.js';
import type { VariableCharacteristics } from '../layers/sequelize/model/DeviceModel/VariableCharacteristics.js';
import type { VariableAttributeQuerystring } from './queries/VariableAttribute.js';
import type { AuthorizationQuerystring } from './queries/Authorization.js';
import type { TariffQueryString } from './queries/Tariff.js';

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
    status: RegistrationStatusEnumType,
    statusInfo: OCPP2_common_types.StatusInfoType | undefined,
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

export interface IDeviceModelRepository
  extends CrudRepository<OCPP2_common_types.VariableAttributeType> {
  createOrUpdateDeviceModelByStationId(
    tenantId: number,
    value: OCPP2_common_types.ReportDataType,
    stationId: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]>;
  createOrUpdateByGetVariablesResultAndStationId(
    tenantId: number,
    getVariablesResult: OCPP2_common_types.GetVariableResultType[],
    stationId: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]>;
  createOrUpdateBySetVariablesDataAndStationId(
    tenantId: number,
    setVariablesData: OCPP2_common_types.SetVariableDataType[],
    stationId: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]>;
  updateResultByStationId(
    tenantId: number,
    result: OCPP2_common_types.SetVariableResultType,
    stationId: string,
    isoTimestamp: string,
    existingVariableAttribute?: VariableAttribute,
  ): Promise<VariableAttribute | undefined>;
  readAllSetVariableByStationId(
    tenantId: number,
    stationId: string,
  ): Promise<OCPP2_common_types.SetVariableDataType[]>;
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
    componentType: OCPP2_common_types.ComponentType,
    variableType: OCPP2_common_types.VariableType,
  ): Promise<[Component | undefined, Variable | undefined]>;
  findOrCreateEvseAndComponentAndVariable(
    tenantId: number,
    componentType: OCPP2_common_types.ComponentType,
    variableType: OCPP2_common_types.VariableType,
  ): Promise<[Component, Variable]>;
  findOrCreateEvseAndComponent(
    tenantId: number,
    componentType: OCPP2_common_types.ComponentType,
    stationId: string,
  ): Promise<Component>;
  findEvseByIdAndConnectorId(
    tenantId: number,
    id: number,
    connectorId: number | null,
  ): Promise<EvseType | undefined>;
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
    updateType: UpdateEnumType,
    versionNumber: number,
    localAuthorizationList?: OCPP2_common_types.AuthorizationData[],
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
  readConnectorByStationIdAndOcpp16ConnectorId: (
    tenantId: number,
    stationId: string,
    ocpp16ConnectorId: number,
  ) => Promise<Connector | undefined>;
  readEvseByStationIdAndOcpp201EvseId: (
    tenantId: number,
    stationId: string,
    ocpp201EvseId: number,
  ) => Promise<Evse | undefined>;
  readConnectorByStationIdAndOcpp201EvseType: (
    tenantId: number,
    stationId: string,
    ocpp201EvseType: OCPP2_common_types.EVSEType,
  ) => Promise<Connector | undefined>;
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
  updateAllConnectorsByQuery(
    tenantId: number,
    value: Partial<Connector>,
    query: object,
  ): Promise<Connector[]>;
  updateChargingStationTimestamp(
    tenantId: number,
    stationId: string,
    timestamp: string,
  ): Promise<void>;
}

export interface ISecurityEventRepository extends CrudRepository<SecurityEvent> {
  createByStationId: (
    tenantId: number,
    value: OCPP2_request_types.SecurityEventNotificationRequest,
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
    value: OCPP2_request_types.TransactionEventRequest,
    stationId: string,
  ): Promise<Transaction>;
  createMeterValue(
    tenantId: number,
    value: OCPP2_common_types.MeterValueType,
    transactionDatabaseId?: number | null,
    transactionId?: string | null,
    tariffId?: number | null,
  ): Promise<MeterValue>;
  createTransactionByStartTransaction(
    tenantId: number,
    request: OCPP1_6.StartTransactionRequest,
    stationId: string,
  ): Promise<Transaction>;
  updateTransactionByMeterValues(
    tenantId: number,
    meterValues: MeterValueDto[],
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
    evse: OCPP2_common_types.EVSEType,
    chargingStates?: ChargingStateEnumType[],
  ): Promise<Transaction[]>;
  readAllActiveTransactionsByAuthorizationId(
    tenantId: number,
    authorizationId: number,
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
    meterValues: MeterValueDto[],
    reason?: string,
    idTokenDatabaseId?: number,
  ): Promise<StopTransaction>;
  updateTransactionByStationIdAndTransactionId(
    tenantId: number,
    transaction: Partial<Transaction>,
    transactionId: string,
    stationId: string,
  ): Promise<Transaction | undefined>;
  deactivateActiveTransactionsByStationIdAndEvseId(
    tenantId: number,
    stationId: string,
    evseId: number,
    excludeTransactionId: string,
  ): Promise<Transaction[]>;
}

export interface IVariableMonitoringRepository extends CrudRepository<VariableMonitoring> {
  createOrUpdateByMonitoringDataTypeAndStationId(
    tenantId: number,
    value: OCPP2_common_types.MonitoringDataType,
    componentId: string,
    variableId: string,
    stationId: string,
  ): Promise<VariableMonitoring[]>;
  createOrUpdateBySetMonitoringDataTypeAndStationId(
    tenantId: number,
    value: OCPP2_common_types.SetMonitoringDataType,
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
    result: OCPP2_common_types.SetMonitoringResultType,
    stationId: string,
  ): Promise<VariableMonitoring>;
  createEventDatumByComponentIdAndVariableIdAndStationId(
    tenantId: number,
    event: OCPP2_common_types.EventDataType,
    componentId: string,
    variableId: string,
    stationId: string,
  ): Promise<EventData>;
}

export interface IMessageInfoRepository extends CrudRepository<MessageInfo> {
  deactivateAllByStationId(tenantId: number, stationId: string): Promise<void>;
  createOrUpdateByMessageInfoTypeAndStationId(
    tenantId: number,
    value: OCPP2_common_types.MessageInfoType,
    stationId: string,
    componentId?: number,
  ): Promise<MessageInfo>;
}

export interface ITariffRepository extends CrudRepository<Tariff> {
  findByConnectorId(tenantId: number, connectorId: number): Promise<Tariff | undefined>;
  readAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<Tariff[]>;
  deleteAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<Tariff[]>;
  upsertTariff(tenantId: number, tariff: Tariff): Promise<Tariff>;
}

export interface ICertificateRepository extends CrudRepository<Certificate> {
  createOrUpdateCertificate(tenantId: number, certificate: Certificate): Promise<Certificate>;
}

export interface IInstalledCertificateRepository extends CrudRepository<InstalledCertificate> {}
export interface IInstallCertificateAttemptRepository
  extends CrudRepository<InstallCertificateAttempt> {}
export interface IDeleteCertificateAttemptRepository
  extends CrudRepository<DeleteCertificateAttempt> {}

export interface IChargingProfileRepository extends CrudRepository<ChargingProfile> {
  createOrUpdateChargingProfile(
    tenantId: number,
    chargingProfile: ChargingProfileInput,
    stationId: string,
    evseId?: number | null,
    chargingLimitSource?: ChargingLimitSourceEnumType,
    isActive?: boolean,
  ): Promise<ChargingProfile>;
  createChargingNeeds(
    tenantId: number,
    chargingNeeds: OCPP2_request_types.NotifyEVChargingNeedsRequest,
    stationId: string,
  ): Promise<ChargingNeeds>;
  findChargingNeedsByEvseDBIdAndTransactionDBId(
    tenantId: number,
    evseDBId: number,
    transactionDataBaseId: number,
  ): Promise<ChargingNeeds | undefined>;
  createCompositeSchedule(
    tenantId: number,
    compositeSchedule: CompositeScheduleInput,
    stationId: string,
  ): Promise<CompositeSchedule>;
  getNextChargingProfileId(tenantId: number, stationId: string): Promise<number>;
  getNextChargingScheduleId(tenantId: number, stationId: string): Promise<number>;
  getNextStackLevel(
    tenantId: number,
    stationId: string,
    transactionDatabaseId: number | null,
    profilePurpose: ChargingProfilePurposeEnumType,
  ): Promise<number>;
}

export interface IReservationRepository extends CrudRepository<Reservation> {
  createOrUpdateReservation(
    tenantId: number,
    reserveNowRequest: OCPP2_request_types.ReserveNowRequest,
    stationId: string,
    isActive?: boolean,
  ): Promise<Reservation | undefined>;
}

export interface IOCPPMessageRepository extends CrudRepository<OCPPMessage> {
  createOCPPMessage(tenantId: number, message: OCPPMessageDto): Promise<OCPPMessage>;
  getRequestByCorrelationId(
    tenantId: number,
    correlationId: string,
  ): Promise<OCPPMessage | undefined>;
}

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
    type: ChargingStationSequenceTypeEnumType,
  ): Promise<number>;
}

export interface IServerNetworkProfileRepository extends CrudRepository<ServerNetworkProfile> {
  upsertServerNetworkProfile(
    websocketServerConfig: any,
    maxCallLengthSeconds: number,
  ): Promise<ServerNetworkProfile>;
}

export interface IChangeConfigurationRepository extends CrudRepository<ChangeConfiguration> {
  createOrUpdateChangeConfiguration(
    tenantId: number,
    configuration: ChangeConfiguration,
  ): Promise<ChangeConfiguration | undefined>;
}

export interface ITenantRepository extends CrudRepository<Tenant> {
  createTenant(tenant: Tenant): Promise<Tenant>;
}
