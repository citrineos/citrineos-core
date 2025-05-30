import { Optional } from 'sequelize';
import { Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import {
  AdditionalInfo,
  Authorization,
  IdToken,
  IdTokenInfo,
  LocalListAuthorization,
  LocalListVersion,
  LocalListVersionAuthorization,
  SendLocalList,
  SendLocalListAuthorization,
} from './Authorization';
import { Boot } from './Boot';
import { Certificate, InstalledCertificate } from './Certificate';
import { ChangeConfiguration } from './ChangeConfiguration';
import {
  ChargingNeeds,
  ChargingProfile,
  ChargingSchedule,
  CompositeSchedule,
  SalesTariff,
} from './ChargingProfile';
import {
  ChargingStation,
  ChargingStationNetworkProfile,
  Connector,
  Location,
  ServerNetworkProfile,
  SetNetworkProfile,
  StatusNotification,
} from './Location';
import { ChargingStationSecurityInfo } from './ChargingStationSecurityInfo';
import { ChargingStationSequence } from './ChargingStationSequence';
import {
  Component,
  Evse,
  Variable,
  VariableAttribute,
  VariableCharacteristics,
  VariableStatus,
} from './DeviceModel';
import { ComponentVariable } from './DeviceModel/ComponentVariable';
import { EventData, VariableMonitoring, VariableMonitoringStatus } from './VariableMonitoring';
import { IdTokenAdditionalInfo } from './Authorization/IdTokenAdditionalInfo';
import {
  MeterValue,
  StartTransaction,
  StopTransaction,
  Transaction,
  TransactionEvent,
} from './TransactionEvent';
import { MessageInfo } from './MessageInfo';
import { OCPPMessage } from './OCPPMessage';
import { Reservation } from './Reservation';
import { SecurityEvent } from './SecurityEvent';
import { LatestStatusNotification } from './Location/LatestStatusNotification';
import { Subscription } from './Subscription';
import { Tariff } from './Tariff';

export enum TenantAttributeProps {
  id = 'id',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}

export interface TenantAttributes {
  [TenantAttributeProps.id]: string;
  [TenantAttributeProps.createdAt]: Date;
  [TenantAttributeProps.updatedAt]: Date;
}

export interface TenantCreationAttributes
  extends Optional<
    TenantAttributes,
    TenantAttributeProps.createdAt | TenantAttributeProps.updatedAt
  > {}

@Table
export class Tenant extends Model<TenantAttributes, TenantCreationAttributes> {
  static readonly MODEL_NAME: string = 'Tenant';

  @PrimaryKey
  @Column(DataType.INTEGER)
  declare id: number;

  @Column(DataType.STRING)
  declare name: string;

  /**
   * Relationships
   */

  @HasMany(() => AdditionalInfo)
  declare additionalInfos: AdditionalInfo[];

  @HasMany(() => Authorization)
  declare authorizations: Authorization[];

  @HasMany(() => Boot)
  declare boots: Boot[];

  @HasMany(() => Certificate)
  declare certificates: Certificate[];

  @HasMany(() => InstalledCertificate)
  declare installedCertificates: InstalledCertificate[];

  @HasMany(() => ChangeConfiguration)
  declare changeConfigurations: ChangeConfiguration[];

  @HasMany(() => ChargingNeeds)
  declare chargingNeeds: ChargingNeeds[];

  @HasMany(() => ChargingProfile)
  declare chargingProfiles: ChargingProfile[];

  @HasMany(() => ChargingSchedule)
  declare chargingSchedules: ChargingSchedule[];

  @HasMany(() => ChargingStation)
  declare chargingStations: ChargingStation[];

  @HasMany(() => ChargingStationNetworkProfile)
  declare chargingStationNetworkProfiles: ChargingStationNetworkProfile[];

  @HasMany(() => ChargingStationSecurityInfo)
  declare chargingStationSecurityInfos: ChargingStationSecurityInfo[];

  @HasMany(() => ChargingStationSequence)
  declare chargingStationSequences: ChargingStationSequence[];

  @HasMany(() => Component)
  declare components: Component[];

  @HasMany(() => ComponentVariable)
  declare componentVariables: ComponentVariable[];

  @HasMany(() => CompositeSchedule)
  declare compositeSchedules: CompositeSchedule[];

  @HasMany(() => Connector)
  declare connectors: Connector[];

  @HasMany(() => Evse)
  declare evses: Evse[];

  @HasMany(() => EventData)
  declare eventDatas: EventData[];

  @HasMany(() => IdToken)
  declare idTokens: IdToken[];

  @HasMany(() => IdTokenAdditionalInfo)
  declare idTokenAdditionalInfos: IdTokenAdditionalInfo[];

  @HasMany(() => IdTokenInfo)
  declare idTokenInfos: IdTokenInfo[];

  @HasMany(() => Location)
  declare locations: Location[];

  @HasMany(() => MeterValue)
  declare meterValues: MeterValue[];

  @HasMany(() => MessageInfo)
  declare messageInfos: MessageInfo[];

  @HasMany(() => OCPPMessage)
  declare ocppMessages: OCPPMessage[];

  @HasMany(() => Reservation)
  declare reservations: Reservation[];

  @HasMany(() => SalesTariff)
  declare salesTariffs: SalesTariff[];

  @HasMany(() => SecurityEvent)
  declare securityEvents: SecurityEvent[];

  @HasMany(() => SetNetworkProfile)
  declare setNetworkProfiles: SetNetworkProfile[];

  @HasMany(() => ServerNetworkProfile)
  declare serverNetworkProfiles: ServerNetworkProfile[];

  @HasMany(() => Transaction)
  declare transactions: Transaction[];

  @HasMany(() => StartTransaction)
  declare startTransactions: StartTransaction[];

  @HasMany(() => StatusNotification)
  declare statusNotifications: StatusNotification[];

  @HasMany(() => StopTransaction)
  declare stopTransactions: StopTransaction[];

  @HasMany(() => LatestStatusNotification)
  declare latestStatusNotifications: LatestStatusNotification[];

  @HasMany(() => Subscription)
  declare subscriptions: Subscription[];

  @HasMany(() => TransactionEvent)
  declare transactionEvents: TransactionEvent[];

  @HasMany(() => Tariff)
  declare tariffs: Tariff[];

  @HasMany(() => VariableAttribute)
  declare variableAttributes: VariableAttribute[];

  @HasMany(() => VariableCharacteristics)
  declare variableCharacteristics: VariableCharacteristics[];

  @HasMany(() => VariableMonitoring)
  declare variableMonitorings: VariableMonitoring[];

  @HasMany(() => VariableMonitoringStatus)
  declare variableMonitoringStatuses: VariableMonitoringStatus[];

  @HasMany(() => VariableStatus)
  declare variableStatuses: VariableStatus[];

  @HasMany(() => Variable)
  declare variables: Variable[];

  @HasMany(() => LocalListAuthorization)
  declare localListAuthorizations: LocalListAuthorization[];

  @HasMany(() => LocalListVersion)
  declare localListVersions: LocalListVersion[];

  @HasMany(() => LocalListVersionAuthorization)
  declare localListVersionAuthorizations: LocalListVersionAuthorization[];

  @HasMany(() => SendLocalList)
  declare sendLocalLists: SendLocalList[];

  @HasMany(() => SendLocalListAuthorization)
  declare sendLocalListAuthorizations: SendLocalListAuthorization[];
}
