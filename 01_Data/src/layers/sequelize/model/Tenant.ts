// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ServerProfile, TenantDto } from '@citrineos/base';
import type { Optional } from 'sequelize';
import { Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import {
  Authorization,
  LocalListAuthorization,
  LocalListVersion,
  LocalListVersionAuthorization,
  SendLocalList,
  SendLocalListAuthorization,
} from './Authorization/index.js';
import { Boot } from './Boot.js';
import { Certificate, InstalledCertificate } from './Certificate/index.js';
import { ChangeConfiguration } from './ChangeConfiguration.js';
import {
  ChargingNeeds,
  ChargingProfile,
  ChargingSchedule,
  CompositeSchedule,
  SalesTariff,
} from './ChargingProfile/index.js';
import { ChargingStationSecurityInfo } from './ChargingStationSecurityInfo.js';
import { ChargingStationSequence } from './ChargingStationSequence/index.js';
import { ComponentVariable } from './DeviceModel/ComponentVariable.js';
import {
  Component,
  EvseType,
  Variable,
  VariableAttribute,
  VariableCharacteristics,
  VariableStatus,
} from './DeviceModel/index.js';
import {
  ChargingStation,
  ChargingStationNetworkProfile,
  Connector,
  LatestStatusNotification,
  ServerNetworkProfile,
  SetNetworkProfile,
  StatusNotification,
} from './Location/index.js';
import { Location } from './Location/Location.js';
import { MessageInfo } from './MessageInfo/index.js';
import { OCPPMessage } from './OCPPMessage.js';
import { Reservation } from './Reservation.js';
import { SecurityEvent } from './SecurityEvent.js';
import { Subscription } from './Subscription/index.js';
import { Tariff } from './Tariff/index.js';
import { TenantPartner } from './TenantPartner.js';
import {
  MeterValue,
  StartTransaction,
  StopTransaction,
  Transaction,
  TransactionEvent,
} from './TransactionEvent/index.js';
import {
  EventData,
  VariableMonitoring,
  VariableMonitoringStatus,
} from './VariableMonitoring/index.js';

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
export class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantDto {
  static readonly MODEL_NAME: string = 'Tenant';

  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
  })
  declare id: number;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare url?: string | null;

  @Column(DataType.STRING)
  declare partyId?: string | null;

  @Column(DataType.STRING)
  declare countryCode?: string | null;

  @Column(DataType.JSONB)
  declare serverProfileOCPI?: ServerProfile | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isUserTenant: boolean;

  /**
   * Relationships
   */

  @HasMany(() => TenantPartner)
  declare tenantPartners: TenantPartner[];

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

  @HasMany(() => EvseType)
  declare evses: EvseType[];

  @HasMany(() => EventData)
  declare eventDatas: EventData[];

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
