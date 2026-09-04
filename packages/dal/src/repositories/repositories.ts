// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CrudRepository } from '@citrineos/base';
import type {
  AuthorizationDto,
  BootCreate,
  BootDto,
  CallAction,
  CertificateCreate,
  CertificateDto,
  CertificateUseEnumType,
  ChangeConfigurationCreate,
  ChangeConfigurationDto,
  ChargingLimitSourceEnumType,
  ChargingProfilePurposeEnumType,
  ChargingStateEnumType,
  ChargingStationSequenceTypeEnumType,
  ConnectorDto,
  DeleteCertificateAttemptCreate,
  DeleteCertificateAttemptDto,
  DeleteCertificateStatusEnumType,
  EvseDto,
  HashAlgorithmEnumType,
  InstallCertificateAttemptCreate,
  InstallCertificateAttemptDto,
  InstallCertificateStatusEnumType,
  InstalledCertificateCreate,
  InstalledCertificateDto,
  MeterValueDto,
  OCPP1_6,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPPMessageDto,
  OCPPVersion,
  SecurityEventDto,
  ServerNetworkProfileDto,
  SubscriptionDto,
  TariffDto,
  TenantDto,
  UpdateEnumType,
} from '@citrineos/types';
import type { AuthorizationQuerystring } from '../interfaces/queries/authorization.js';
import type { TariffQueryString } from '../interfaces/queries/tariff.js';
import type { VariableAttributeQuerystring } from '../interfaces/queries/variable-attribute.js';
import type {
  ChargingProfileInput,
  CompositeScheduleInput,
} from '../mappers/2.0.1/charging-profile-mapper.js';
import type { LocalListVersion } from '../models/authorization/local-list-version.js';
import type { SendLocalList } from '../models/authorization/send-local-list.js';
import type {
  ChargingNeeds,
  ChargingProfile,
  CompositeSchedule,
} from '../models/charging-profile/index.js';
import type { ChargingStationSecurityInfo } from '../models/charging-station-security-info.js';
import type { ChargingStationSequence } from '../models/charging-station-sequence/charging-station-sequence.js';
import type { Component } from '../models/device-model/component.js';
import type { EvseType } from '../models/device-model/evse-type.js';
import type { VariableAttribute } from '../models/device-model/variable-attribute.js';
import type { VariableCharacteristics } from '../models/device-model/variable-characteristics.js';
import type { Variable } from '../models/device-model/variable.js';
import type { ChargingStationNetworkProfile } from '../models/location/charging-station-network-profile.js';
import type { ChargingStation } from '../models/location/charging-station.js';
import type { Connector } from '../models/location/connector.js';
import type { Evse } from '../models/location/evse.js';
import type { Location } from '../models/location/location.js';
import type { SetNetworkProfile } from '../models/location/set-network-profile.js';
import type { StatusNotification } from '../models/location/status-notification.js';
import type { MessageInfo } from '../models/message-info/message-info.js';
import type { Reservation } from '../models/reservation.js';
import type {
  MeterValue,
  StopTransaction,
  Transaction,
} from '../models/transaction-event/index.js';
import type { TransactionEvent } from '../models/transaction-event/transaction-event.js';
import type { EventData, VariableMonitoring } from '../models/variable-monitoring/index.js';

export interface IAuthorizationRepository {
  readAllByQuerystring: (
    tenantId: number,
    query: AuthorizationQuerystring,
  ) => Promise<AuthorizationDto[]>;
  readOnlyOneByQuerystring: (
    tenantId: number,
    query: AuthorizationQuerystring,
  ) => Promise<AuthorizationDto | undefined>;
  findAllAuthorizationsWithTariffs: (tenantId: number) => Promise<AuthorizationDto[]>;
}

/**
 * Key is StationId
 */
export interface IBootRepository {
  createOrUpdateByKey: (
    tenantId: number,
    value: BootCreate,
    key: string,
  ) => Promise<BootDto | undefined>;
  updateByKey: (tenantId: number, value: object, key: string) => Promise<BootDto | undefined>;
  readByKey: (tenantId: number, key: string) => Promise<BootDto | undefined>;
  existsByKey: (tenantId: number, key: string) => Promise<boolean>;
  deleteByKey: (tenantId: number, key: string) => Promise<BootDto | undefined>;
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
  readConnectorsWithTariffsByStationId: (
    tenantId: number,
    ocppConnectionName: string,
    evseTypeId?: number,
  ) => Promise<Connector[]>;
  setChargingStationIsOnlineAndOCPPVersion: (
    tenantId: number,
    ocppConnectionName: string,
    isOnline: boolean,
    ocppVersion: OCPPVersion | null,
    connectedWebsocketServerConfigId?: string | null,
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
  createOrUpdateEvse(tenantId: number, evse: EvseDto): Promise<EvseDto>;
  createOrUpdateOcpp16Connector(
    tenantId: number,
    connector: ConnectorDto & { connectorId: number },
  ): Promise<Connector | undefined>;
  createOrUpdateOcpp2Connector(
    tenantId: number,
    connector: ConnectorDto & { evseTypeConnectorId: number },
  ): Promise<Connector | undefined>;
  autoCommissionEvseForOcpp16Connector(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<{ evseId: number }>;
  updateAllConnectorsByQuery(
    tenantId: number,
    value: ConnectorDto,
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

// ORM-agnostic contract: returns SubscriptionDto so both the Sequelize
// (model implements SubscriptionDto) and Drizzle implementations satisfy it.
export interface ISubscriptionRepository {
  create(tenantId: number, value: SubscriptionDto): Promise<SubscriptionDto>;
  readAllByStationId(tenantId: number, ocppConnectionName: string): Promise<SubscriptionDto[]>;
  deleteByKey(tenantId: number, key: string): Promise<SubscriptionDto | undefined>;
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

export interface ITariffRepository {
  findById(tenantId: number, id: number): Promise<TariffDto | undefined>;
  findByConnectorId(tenantId: number, connectorId: number): Promise<TariffDto | undefined>;
  readAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<TariffDto[]>;
  deleteAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<TariffDto[]>;
  upsertTariff(tenantId: number, tariff: TariffDto): Promise<TariffDto>;
  upsertTariffByTariffId(tenantId: number, tariff: TariffDto): Promise<TariffDto>;
}

export interface ICertificateRepository {
  findByFileHash(tenantId: number, hash: string): Promise<CertificateDto | undefined>;
  findById(tenantId: number, id: number): Promise<CertificateDto | undefined>;
  createCertificate(tenantId: number, input: CertificateCreate): Promise<CertificateDto>;
  createOrUpdateCertificate(tenantId: number, input: CertificateCreate): Promise<CertificateDto>;
}

type InstalledCertificateHashData = Pick<
  InstalledCertificateDto,
  'hashAlgorithm' | 'issuerNameHash' | 'issuerKeyHash' | 'serialNumber'
>;
type InstalledCertificateCreateInput = Omit<InstalledCertificateCreate, 'hashAlgorithm'> & {
  hashAlgorithm?: HashAlgorithmEnumType;
  certificateId?: number | null;
};

export interface IInstalledCertificateRepository {
  findByStationAndType(
    tenantId: number,
    ocppConnectionName: string,
    certificateType: CertificateUseEnumType,
  ): Promise<InstalledCertificateDto | undefined>;
  findByIdAndStation(
    tenantId: number,
    id: number,
    ocppConnectionName: string,
  ): Promise<InstalledCertificateDto | undefined>;
  getLinkedCertificate(
    tenantId: number,
    installedCertificateId: number,
  ): Promise<CertificateDto | undefined>;
  createInstalledCertificate(
    tenantId: number,
    input: InstalledCertificateCreateInput,
  ): Promise<InstalledCertificateDto>;
  setCertificateId(
    tenantId: number,
    id: number,
    certificateId: number,
  ): Promise<InstalledCertificateDto | undefined>;
  updateHashData(
    tenantId: number,
    id: number,
    hashData: InstalledCertificateHashData,
  ): Promise<InstalledCertificateDto | undefined>;
  findAllByStation(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<InstalledCertificateDto[]>;
  deleteById(tenantId: number, id: number): Promise<InstalledCertificateDto | undefined>;
  deleteByStation(tenantId: number, ocppConnectionName: string): Promise<InstalledCertificateDto[]>;
  deleteByStationAndType(
    tenantId: number,
    ocppConnectionName: string,
    certificateType: CertificateUseEnumType,
  ): Promise<InstalledCertificateDto[]>;
  deleteByStationAndHashData(
    tenantId: number,
    ocppConnectionName: string,
    hashData: InstalledCertificateHashData,
  ): Promise<InstalledCertificateDto[]>;
}
export interface IInstallCertificateAttemptRepository {
  findPendingByStationTypeAndCertHash(
    tenantId: number,
    ocppConnectionName: string,
    certificateType: CertificateUseEnumType,
    certificateFileHash: string,
    requestId?: number | null,
  ): Promise<InstallCertificateAttemptDto | undefined>;
  findPendingByStation(
    tenantId: number,
    ocppConnectionName: string,
    requestId?: number | null,
    certificateType?: CertificateUseEnumType,
  ): Promise<InstallCertificateAttemptDto | undefined>;
  createAttempt(
    tenantId: number,
    input: InstallCertificateAttemptCreate,
  ): Promise<InstallCertificateAttemptDto>;
  updateStatus(
    tenantId: number,
    id: number,
    status: InstallCertificateStatusEnumType,
  ): Promise<InstallCertificateAttemptDto | undefined>;
  getLinkedCertificate(tenantId: number, attemptId: number): Promise<CertificateDto | undefined>;
}
type DeleteCertificateHashData = Pick<
  DeleteCertificateAttemptDto,
  'hashAlgorithm' | 'issuerNameHash' | 'issuerKeyHash' | 'serialNumber'
>;

export interface IDeleteCertificateAttemptRepository {
  findPendingByStationAndHashData(
    tenantId: number,
    ocppConnectionName: string,
    hashData: DeleteCertificateHashData,
  ): Promise<DeleteCertificateAttemptDto | undefined>;
  findPendingByStation(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<DeleteCertificateAttemptDto | undefined>;
  createAttempt(
    tenantId: number,
    input: DeleteCertificateAttemptCreate,
  ): Promise<DeleteCertificateAttemptDto>;
  updateStatus(
    tenantId: number,
    id: number,
    status: DeleteCertificateStatusEnumType,
  ): Promise<DeleteCertificateAttemptDto | undefined>;
}

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

export interface IOCPPMessageRepository {
  createOCPPMessage(tenantId: number, message: OCPPMessageDto): Promise<OCPPMessageDto>;
  getRequestByCorrelationId(
    tenantId: number,
    correlationId: string,
  ): Promise<OCPPMessageDto | undefined>;
  readOnlyOneByQuery(tenantId: number, query: object): Promise<OCPPMessageDto | undefined>;
  readAllByQuery(tenantId: number, query: object): Promise<OCPPMessageDto[]>;
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

export interface IServerNetworkProfileRepository {
  upsertServerNetworkProfile(
    websocketServerConfig: any,
    maxCallLengthSeconds: number,
  ): Promise<ServerNetworkProfileDto>;
}

export interface IChargingStationNetworkProfileRepository
  extends CrudRepository<ChargingStationNetworkProfile> {
  deleteAllByStationIdAndConfigurationSlots(
    tenantId: number,
    ocppConnectionName: string,
    configurationSlot: number[],
  ): Promise<ChargingStationNetworkProfile[]>;
}

export type SetNetworkProfileCreationAttributes = Parameters<typeof SetNetworkProfile.build>[0];

export interface ISetNetworkProfileRepository extends CrudRepository<SetNetworkProfile> {
  createPending(values: SetNetworkProfileCreationAttributes): Promise<SetNetworkProfile>;
}

export interface IChangeConfigurationRepository {
  findByStationAndKey(
    tenantId: number,
    ocppConnectionName: string,
    key: string,
  ): Promise<ChangeConfigurationDto | undefined>;
  listByStation(tenantId: number, ocppConnectionName: string): Promise<ChangeConfigurationDto[]>;
  createOrUpdateChangeConfiguration(
    tenantId: number,
    input: ChangeConfigurationCreate,
  ): Promise<ChangeConfigurationDto | undefined>;
}
export interface ITenantRepository {
  createTenant(tenant: TenantDto): Promise<TenantDto>;
  readByKey(tenantId: number, key: string | number): Promise<TenantDto | undefined>;
  readByWebsocketServerPath(path: string): Promise<TenantDto | undefined>;
  readAllWithWebsocketServerPath(): Promise<TenantDto[]>;
  updateWebsocketServerPath(tenantId: number, path: string | null): Promise<TenantDto | undefined>;
}
