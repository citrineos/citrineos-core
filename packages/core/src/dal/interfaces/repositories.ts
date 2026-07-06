// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  BootConfig,
  CallAction,
  ChargingLimitSourceEnumType,
  ChargingProfilePurposeEnumType,
  ChargingStateEnumType,
  ChargingStationSequenceTypeEnumType,
  CrudRepository,
  MeterValueDto,
  OCPP1_6,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPPMessageDto,
  OCPPVersion,
  RegistrationStatusEnumType,
  SecurityEventDto,
  UpdateEnumType,
} from '@citrineos/base';
import type {
  ChargingProfileInput,
  CompositeScheduleInput,
} from '../layers/sequelize/mapper/2.0.1/ChargingProfileMapper.js';
import type { Authorization } from '../layers/sequelize/model/Authorization/Authorization.js';
import type { LocalListVersion } from '../layers/sequelize/model/Authorization/LocalListVersion.js';
import type { SendLocalList } from '../layers/sequelize/model/Authorization/SendLocalList.js';
import type { Boot } from '../layers/sequelize/model/Boot.js';
import type { Certificate } from '../layers/sequelize/model/Certificate/Certificate.js';
import type {
  DeleteCertificateAttempt,
  InstallCertificateAttempt,
  InstalledCertificate,
} from '../layers/sequelize/model/Certificate/index.js';
import type { ChangeConfiguration } from '../layers/sequelize/model/ChangeConfiguration.js';
import type {
  ChargingNeeds,
  ChargingProfile,
  CompositeSchedule,
} from '../layers/sequelize/model/ChargingProfile/index.js';
import type { ChargingStationSecurityInfo } from '../layers/sequelize/model/ChargingStationSecurityInfo.js';
import type { ChargingStationSequence } from '../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.js';
import type { Component } from '../layers/sequelize/model/DeviceModel/Component.js';
import type { EvseType } from '../layers/sequelize/model/DeviceModel/EvseType.js';
import type { Variable } from '../layers/sequelize/model/DeviceModel/Variable.js';
import type { VariableAttribute } from '../layers/sequelize/model/DeviceModel/VariableAttribute.js';
import type { VariableCharacteristics } from '../layers/sequelize/model/DeviceModel/VariableCharacteristics.js';
import type { ChargingStation } from '../layers/sequelize/model/Location/ChargingStation.js';
import type { Connector } from '../layers/sequelize/model/Location/Connector.js';
import type { Evse } from '../layers/sequelize/model/Location/Evse.js';
import type { Location } from '../layers/sequelize/model/Location/Location.js';
import type { ServerNetworkProfile } from '../layers/sequelize/model/Location/ServerNetworkProfile.js';
import type { StatusNotification } from '../layers/sequelize/model/Location/StatusNotification.js';
import type { MessageInfo } from '../layers/sequelize/model/MessageInfo/MessageInfo.js';
import type { OCPPMessage } from '../layers/sequelize/model/OCPPMessage.js';
import type { Reservation } from '../layers/sequelize/model/Reservation.js';
import type { Subscription } from '../layers/sequelize/model/Subscription/Subscription.js';
import type { Tariff } from '../layers/sequelize/model/Tariff/Tariffs.js';
import type { Tenant } from '../layers/sequelize/model/Tenant.js';
import type {
  MeterValue,
  StopTransaction,
  Transaction,
} from '../layers/sequelize/model/TransactionEvent/index.js';
import type { TransactionEvent } from '../layers/sequelize/model/TransactionEvent/TransactionEvent.js';
import type {
  EventData,
  VariableMonitoring,
} from '../layers/sequelize/model/VariableMonitoring/index.js';
import type { AuthorizationQuerystring } from './queries/Authorization.js';
import type { TariffQueryString } from './queries/Tariff.js';
import type { VariableAttributeQuerystring } from './queries/VariableAttribute.js';

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
    ocppConnectionName: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]>;
  createOrUpdateByGetVariablesResultAndStationId(
    tenantId: number,
    getVariablesResult: OCPP2_common_types.GetVariableResultType[],
    ocppConnectionName: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]>;
  createOrUpdateBySetVariablesDataAndStationId(
    tenantId: number,
    setVariablesData: OCPP2_common_types.SetVariableDataType[],
    ocppConnectionName: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]>;
  updateResultByStationId(
    tenantId: number,
    result: OCPP2_common_types.SetVariableResultType,
    ocppConnectionName: string,
    isoTimestamp: string,
    existingVariableAttribute?: VariableAttribute,
  ): Promise<VariableAttribute | undefined>;
  readAllSetVariableByStationId(
    tenantId: number,
    ocppConnectionName: string,
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
    ocppConnectionName: string,
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
   * @param ocppConnectionName - The connection name of the charging station
   * @param {string} correlationId - The correlation ID.
   * @param {UpdateEnumType} updateType - The type of update.
   * @param {number} versionNumber - The version number.
   * @param {AuthorizationData[]} localAuthorizationList - The list of authorizations.
   * @return {SendLocalList} The database object. Contains the correlationId to be used for the sendLocalListRequest.
   */
  createSendLocalListFromRequestData(
    tenantId: number,
    ocppConnectionName: string,
    correlationId: string,
    updateType: UpdateEnumType,
    versionNumber: number,
    localAuthorizationList?: OCPP2_common_types.AuthorizationData[],
  ): Promise<SendLocalList>;
  /**
   * OCPP 1.6 variant. Resolves Authorization rows by flat idTag (no IdTokenEnumType).
   * For DIFFERENTIAL deletes, an entry without idTagInfo is allowed and recorded as a tombstone.
   */
  createSendLocalListFromRequestData16(
    tenantId: number,
    stationId: string,
    correlationId: string,
    updateType: OCPP1_6.SendLocalListRequestUpdateType,
    versionNumber: number,
    localAuthorizationList?: NonNullable<OCPP1_6.SendLocalListRequest['localAuthorizationList']>,
  ): Promise<SendLocalList>;
  /**
   * Used to process GetLocalListVersionResponse, if version is unknown it will create or update LocalListVersion with the new version and an empty localAuthorizationList.
   * @param tenantId
   * @param versionNumber
   * @param ocppConnectionName - The connection name of the charging station
   */
  validateOrReplaceLocalListVersionForStation(
    tenantId: number,
    versionNumber: number,
    ocppConnectionName: string,
  ): Promise<void>;
  getSendLocalListRequestByStationIdAndCorrelationId(
    tenantId: number,
    ocppConnectionName: string,
    correlationId: string,
  ): Promise<SendLocalList | undefined>;
  /**
   * Used to process SendLocalListResponse.
   * @param tenantId
   * @param ocppConnectionName - The connection name of the charging station
   * @param {SendLocalList} sendLocalList - The SendLocalList object created from the associated SendLocalListRequest.
   * @returns {LocalListVersion} LocalListVersion - The updated LocalListVersion.
   */
  createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
    tenantId: number,
    ocppConnectionName: string,
    sendLocalList: SendLocalList,
  ): Promise<LocalListVersion>;
}

export interface ILocationRepository extends CrudRepository<Location> {
  readLocationById: (tenantId: number, id: number) => Promise<Location | undefined>;
  readChargingStationByStationId: (
    tenantId: number,
    ocppConnectionName: string,
  ) => Promise<ChargingStation | undefined>;
  readConnectorByStationIdAndOcpp16ConnectorId: (
    tenantId: number,
    ocppConnectionName: string,
    ocpp16ConnectorId: number,
  ) => Promise<Connector | undefined>;
  readEvseByStationIdAndOcpp201EvseId: (
    tenantId: number,
    ocppConnectionName: string,
    ocpp201EvseId: number,
  ) => Promise<Evse | undefined>;
  readConnectorByStationIdAndOcpp201EvseType: (
    tenantId: number,
    ocppConnectionName: string,
    ocpp201EvseType: OCPP2_common_types.EVSEType,
  ) => Promise<Connector | undefined>;
  setChargingStationIsOnlineAndOCPPVersion: (
    tenantId: number,
    ocppConnectionName: string,
    isOnline: boolean,
    ocppVersion: OCPPVersion | null,
  ) => Promise<ChargingStation | undefined>;
  doesChargingStationExistByStationId: (
    tenantId: number,
    ocppConnectionName: string,
  ) => Promise<boolean>;
  addStatusNotificationToChargingStation(
    tenantId: number,
    ocppConnectionName: string,
    statusNotification: StatusNotification,
  ): Promise<void>;
  createOrUpdateChargingStation(
    tenantId: number,
    chargingStation: ChargingStation,
  ): Promise<ChargingStation>;
  createOrUpdateConnector(tenantId: number, connector: Connector): Promise<Connector | undefined>;
  /**
   * Commissions a default evse + evseTypeConnector record for an OCPP 1.6 connector.
   * Used in ad-hoc/`allowUnknownChargingStations` flows where the charge point arrives
   * uncommissioned (OCPP 1.6 has no native EVSE concept). Conservative default:
   * one connector → one evse. Returns the FK ids the caller should stamp on the
   * Connector record being upserted.
   */
  commissionEvseForOcpp16Connector(
    tenantId: number,
    ocppConnectionName: string,
    connectorId: number,
  ): Promise<{ evseId: number; evseTypeConnectorId: number }>;
  updateAllConnectorsByQuery(
    tenantId: number,
    value: Partial<Connector>,
    query: object,
  ): Promise<Connector[]>;
  updateChargingStationTimestamp(
    tenantId: number,
    ocppConnectionName: string,
    timestamp: string,
  ): Promise<void>;
}

export interface ISecurityEventRepository {
  createByStationId: (
    tenantId: number,
    value: OCPP2_request_types.SecurityEventNotificationRequest,
    ocppConnectionName: string,
  ) => Promise<SecurityEventDto>;
  readByStationIdAndTimestamps: (
    tenantId: number,
    ocppConnectionName: string,
    from?: Date,
    to?: Date,
  ) => Promise<SecurityEventDto[]>;
  deleteByKey: (tenantId: number, key: string) => Promise<SecurityEventDto | undefined>;
}

export interface ISubscriptionRepository extends CrudRepository<Subscription> {
  create(tenantId: number, value: Subscription): Promise<Subscription>;
  readAllByStationId(tenantId: number, ocppConnectionName: string): Promise<Subscription[]>;
  deleteByKey(tenantId: number, key: string): Promise<Subscription | undefined>;
}

export interface ITransactionEventRepository extends CrudRepository<TransactionEvent> {
  createOrUpdateTransactionByTransactionEventAndStationId(
    tenantId: number,
    value: OCPP2_request_types.TransactionEventRequest,
    ocppConnectionName: string,
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
    ocppConnectionName: string,
  ): Promise<Transaction>;
  updateTransactionByMeterValues(
    tenantId: number,
    meterValues: MeterValueDto[],
    ocppConnectionName: string,
    transactionId: number,
  ): Promise<void>;
  readAllByStationIdAndTransactionId(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: string,
  ): Promise<TransactionEvent[]>;
  readTransactionByStationIdAndTransactionId(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: string,
  ): Promise<Transaction | undefined>;
  readAllTransactionsByStationIdAndEvseAndChargingStates(
    tenantId: number,
    ocppConnectionName: string,
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
    ocppConnectionName: string,
    evseId: number,
  ): Promise<Transaction | undefined>;
  updateTransactionTotalCostById(tenantId: number, totalCost: number, id: number): Promise<void>;
  createStopTransaction(
    tenantId: number,
    transactionDatabaseId: number,
    ocppConnectionName: string,
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
    ocppConnectionName: string,
  ): Promise<Transaction | undefined>;
  deactivateActiveTransactionsByStationIdAndEvseId(
    tenantId: number,
    ocppConnectionName: string,
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
    ocppConnectionName: string,
  ): Promise<VariableMonitoring[]>;
  createOrUpdateBySetMonitoringDataTypeAndStationId(
    tenantId: number,
    value: OCPP2_common_types.SetMonitoringDataType,
    componentId: string,
    variableId: string,
    ocppConnectionName: string,
  ): Promise<VariableMonitoring>;
  rejectAllVariableMonitoringsByStationId(
    tenantId: number,
    action: CallAction,
    ocppConnectionName: string,
  ): Promise<void>;
  rejectVariableMonitoringByIdAndStationId(
    tenantId: number,
    action: CallAction,
    id: number,
    ocppConnectionName: string,
  ): Promise<void>;
  updateResultByStationId(
    tenantId: number,
    result: OCPP2_common_types.SetMonitoringResultType,
    ocppConnectionName: string,
  ): Promise<VariableMonitoring>;
  createEventDatumByComponentIdAndVariableIdAndStationId(
    tenantId: number,
    event: OCPP2_common_types.EventDataType,
    componentId: string,
    variableId: string,
    ocppConnectionName: string,
  ): Promise<EventData>;
}

export interface IMessageInfoRepository extends CrudRepository<MessageInfo> {
  deactivateAllByStationId(tenantId: number, ocppConnectionName: string): Promise<void>;
  createOrUpdateByMessageInfoTypeAndStationId(
    tenantId: number,
    value: OCPP2_common_types.MessageInfoType,
    ocppConnectionName: string,
    componentId?: number,
  ): Promise<MessageInfo>;
}

export interface ITariffRepository extends CrudRepository<Tariff> {
  findByConnectorId(tenantId: number, connectorId: number): Promise<Tariff | undefined>;
  readAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<Tariff[]>;
  deleteAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<Tariff[]>;
  upsertTariff(tenantId: number, tariff: Tariff): Promise<Tariff>;
  upsertTariffByTariffId(tenantId: number, tariff: Tariff): Promise<Tariff>;
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
    ocppConnectionName: string,
    evseId?: number | null,
    chargingLimitSource?: ChargingLimitSourceEnumType,
    isActive?: boolean,
  ): Promise<ChargingProfile>;
  createChargingNeeds(
    tenantId: number,
    chargingNeeds: OCPP2_request_types.NotifyEVChargingNeedsRequest,
    ocppConnectionName: string,
  ): Promise<ChargingNeeds>;
  findChargingNeedsByEvseDBIdAndTransactionDBId(
    tenantId: number,
    evseDBId: number,
    transactionDataBaseId: number,
  ): Promise<ChargingNeeds | undefined>;
  createCompositeSchedule(
    tenantId: number,
    compositeSchedule: CompositeScheduleInput,
    ocppConnectionName: string,
  ): Promise<CompositeSchedule>;
  getNextChargingProfileId(tenantId: number, ocppConnectionName: string): Promise<number>;
  getNextChargingScheduleId(tenantId: number, ocppConnectionName: string): Promise<number>;
  getNextStackLevel(
    tenantId: number,
    ocppConnectionName: string,
    transactionDatabaseId: number | null,
    profilePurpose: ChargingProfilePurposeEnumType,
  ): Promise<number>;
}

export interface IReservationRepository extends CrudRepository<Reservation> {
  createOrUpdateReservation(
    tenantId: number,
    reserveNowRequest: OCPP2_request_types.ReserveNowRequest,
    ocppConnectionName: string,
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
  readChargingStationPublicKeyFileId(tenantId: number, ocppConnectionName: string): Promise<string>;
  readOrCreateChargingStationInfo(
    tenantId: number,
    ocppConnectionName: string,
    publicKeyFileId: string,
  ): Promise<void>;
}

export interface IChargingStationSequenceRepository
  extends CrudRepository<ChargingStationSequence> {
  getNextSequenceValue(
    tenantId: number,
    ocppConnectionName: string,
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
