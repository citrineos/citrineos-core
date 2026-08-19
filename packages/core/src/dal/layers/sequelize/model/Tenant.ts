// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ServerProfile, TenantDto } from '@citrineos/types';
import type { Optional } from 'sequelize';
import { Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { AsyncJobStatus } from './AsyncJob/AsyncJobStatus.js';
import { Authorization } from './Authorization/Authorization.js';
import { LocalListAuthorization } from './Authorization/LocalListAuthorization.js';
import { LocalListVersion } from './Authorization/LocalListVersion.js';
import { LocalListVersionAuthorization } from './Authorization/LocalListVersionAuthorization.js';
import { SendLocalList } from './Authorization/SendLocalList.js';
import { SendLocalListAuthorization } from './Authorization/SendLocalListAuthorization.js';
import { Boot } from './Boot.js';
import { Certificate } from './Certificate/Certificate.js';
import { DeleteCertificateAttempt } from './Certificate/DeleteCertificateAttempt.js';
import { InstallCertificateAttempt } from './Certificate/InstallCertificateAttempt.js';
import { InstalledCertificate } from './Certificate/InstalledCertificate.js';
import { ChangeConfiguration } from './ChangeConfiguration.js';
import { ChargingNeeds } from './ChargingProfile/ChargingNeeds.js';
import { ChargingProfile } from './ChargingProfile/ChargingProfile.js';
import { ChargingSchedule } from './ChargingProfile/ChargingSchedule.js';
import { CompositeSchedule } from './ChargingProfile/CompositeSchedule.js';
import { SalesTariff } from './ChargingProfile/SalesTariff.js';
import { ChargingStationSecurityInfo } from './ChargingStationSecurityInfo.js';
import { ChargingStationSequence } from './ChargingStationSequence/ChargingStationSequence.js';
import { Component } from './DeviceModel/Component.js';
import { ComponentVariable } from './DeviceModel/ComponentVariable.js';
import { EvseType } from './DeviceModel/EvseType.js';
import { Variable } from './DeviceModel/Variable.js';
import { VariableAttribute } from './DeviceModel/VariableAttribute.js';
import { VariableCharacteristics } from './DeviceModel/VariableCharacteristics.js';
import { VariableMonitoring } from './VariableMonitoring/VariableMonitoring.js';
import { VariableMonitoringStatus } from './VariableMonitoring/VariableMonitoringStatus.js';
import { VariableStatus } from './DeviceModel/VariableStatus.js';
import { ChargingStation } from './Location/ChargingStation.js';
import { ChargingStationNetworkProfile } from './Location/ChargingStationNetworkProfile.js';
import { Connector } from './Location/Connector.js';
import { Evse } from './Location/Evse.js';
import { LatestStatusNotification } from './Location/LatestStatusNotification.js';
import { Location } from './Location/Location.js';
import { ServerNetworkProfile } from './Location/ServerNetworkProfile.js';
import { SetNetworkProfile } from './Location/SetNetworkProfile.js';
import { StatusNotification } from './Location/StatusNotification.js';
import { MessageInfo } from './MessageInfo/MessageInfo.js';
import { OCPPMessage } from './OCPPMessage.js';
import { Reservation } from './Reservation.js';
import { SecurityEvent } from './SecurityEvent.js';
import { Subscription } from './Subscription/Subscription.js';
import { Tariff } from './Tariff/Tariffs.js';
import { TenantPartner } from './TenantPartner.js';
import { MeterValue } from './TransactionEvent/MeterValue.js';
import { StartTransaction } from './TransactionEvent/StartTransaction.js';
import { StopTransaction } from './TransactionEvent/StopTransaction.js';
import { Transaction } from './TransactionEvent/Transaction.js';
import { TransactionEvent } from './TransactionEvent/TransactionEvent.js';
import { EventData } from './VariableMonitoring/EventData.js';

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

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
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

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare maxChargingStations: number | null;
  /**
   * Relationships
   */
  @HasMany(() => TenantPartner, 'tenantId')
  declare tenantPartners?: TenantPartner[];

  @HasMany(() => Authorization, 'tenantId')
  declare tenantAuthorizations?: Authorization[];

  @HasMany(() => LocalListAuthorization, 'tenantId')
  declare localListAuthorizations?: LocalListAuthorization[];

  @HasMany(() => LocalListVersion, 'tenantId')
  declare localListVersions?: LocalListVersion[];

  @HasMany(() => LocalListVersionAuthorization, 'tenantId')
  declare localListVersionAuthorizations?: LocalListVersionAuthorization[];

  @HasMany(() => SendLocalList, 'tenantId')
  declare sendLocalLists?: SendLocalList[];

  @HasMany(() => SendLocalListAuthorization, 'tenantId')
  declare sendLocalListAuthorizations?: SendLocalListAuthorization[];

  @HasMany(() => Boot, 'tenantId')
  declare boots?: Boot[];

  @HasMany(() => Certificate, 'tenantId')
  declare certificates?: Certificate[];

  @HasMany(() => DeleteCertificateAttempt, 'tenantId')
  declare deleteCertificateAttempts?: DeleteCertificateAttempt[];

  @HasMany(() => InstallCertificateAttempt, 'tenantId')
  declare installCertificateAttempts?: InstallCertificateAttempt[];

  @HasMany(() => InstalledCertificate, 'tenantId')
  declare installedCertificates?: InstalledCertificate[];

  @HasMany(() => ChangeConfiguration, 'tenantId')
  declare changeConfigurations?: ChangeConfiguration[];

  @HasMany(() => ChargingNeeds, 'tenantId')
  declare chargingNeeds?: ChargingNeeds[];

  @HasMany(() => ChargingProfile, 'tenantId')
  declare chargingProfiles?: ChargingProfile[];

  @HasMany(() => ChargingSchedule, 'tenantId')
  declare chargingSchedules?: ChargingSchedule[];

  @HasMany(() => CompositeSchedule, 'tenantId')
  declare compositeSchedules?: CompositeSchedule[];

  @HasMany(() => SalesTariff, 'tenantId')
  declare salesTariffs?: SalesTariff[];

  @HasMany(() => ChargingStationSecurityInfo, 'tenantId')
  declare chargingStationSecurityInfos?: ChargingStationSecurityInfo[];

  @HasMany(() => ChargingStationSequence, 'tenantId')
  declare chargingStationSequences?: ChargingStationSequence[];

  @HasMany(() => Component, 'tenantId')
  declare components?: Component[];

  @HasMany(() => ComponentVariable, 'tenantId')
  declare componentVariables?: ComponentVariable[];

  @HasMany(() => EvseType, 'tenantId')
  declare evseTypes?: EvseType[];

  @HasMany(() => Variable, 'tenantId')
  declare variables?: Variable[];

  @HasMany(() => VariableAttribute, 'tenantId')
  declare variableAttributes?: VariableAttribute[];

  @HasMany(() => VariableCharacteristics, 'tenantId')
  declare variableCharacteristics?: VariableCharacteristics[];

  @HasMany(() => VariableMonitoring, 'tenantId')
  declare variableMonitorings?: VariableMonitoring[];

  @HasMany(() => VariableMonitoringStatus, 'tenantId')
  declare variableMonitoringStatuses?: VariableMonitoringStatus[];

  @HasMany(() => VariableStatus, 'tenantId')
  declare variableStatuses?: VariableStatus[];

  @HasMany(() => ChargingStation, 'tenantId')
  declare chargingStations?: ChargingStation[];

  @HasMany(() => ChargingStationNetworkProfile, 'tenantId')
  declare chargingStationNetworkProfiles?: ChargingStationNetworkProfile[];

  @HasMany(() => Connector, 'tenantId')
  declare connectors?: Connector[];

  @HasMany(() => Evse, 'tenantId')
  declare evses?: Evse[];

  @HasMany(() => LatestStatusNotification, 'tenantId')
  declare latestStatusNotifications?: LatestStatusNotification[];

  @HasMany(() => Location, 'tenantId')
  declare locations?: Location[];

  @HasMany(() => ServerNetworkProfile, 'tenantId')
  declare serverNetworkProfiles?: ServerNetworkProfile[];

  @HasMany(() => SetNetworkProfile, 'tenantId')
  declare setNetworkProfiles?: SetNetworkProfile[];

  @HasMany(() => StatusNotification, 'tenantId')
  declare statusNotifications?: StatusNotification[];

  @HasMany(() => MessageInfo, 'tenantId')
  declare messageInfos?: MessageInfo[];

  @HasMany(() => OCPPMessage, 'tenantId')
  declare ocppMessages?: OCPPMessage[];

  @HasMany(() => Reservation, 'tenantId')
  declare reservations?: Reservation[];

  @HasMany(() => SecurityEvent, 'tenantId')
  declare securityEvents?: SecurityEvent[];

  @HasMany(() => Subscription, 'tenantId')
  declare subscriptions?: Subscription[];

  @HasMany(() => Tariff, 'tenantId')
  declare tariffs?: Tariff[];

  @HasMany(() => MeterValue, 'tenantId')
  declare meterValues?: MeterValue[];

  @HasMany(() => StartTransaction, 'tenantId')
  declare startTransactions?: StartTransaction[];

  @HasMany(() => StopTransaction, 'tenantId')
  declare stopTransactions?: StopTransaction[];

  @HasMany(() => Transaction, 'tenantId')
  declare transactions?: Transaction[];

  @HasMany(() => TransactionEvent, 'tenantId')
  declare transactionEvents?: TransactionEvent[];

  @HasMany(() => EventData, 'tenantId')
  declare eventData?: EventData[];

  @HasMany(() => AsyncJobStatus, 'tenantId')
  declare asyncJobStatuses?: AsyncJobStatus[];
}
