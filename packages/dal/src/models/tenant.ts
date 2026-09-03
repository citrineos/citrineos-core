// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ServerProfile, TenantDto } from '@citrineos/types';
import type { Optional } from 'sequelize';
import { Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { AsyncJobStatus } from './async-job/async-job-status.js';
import { Authorization } from './authorization/authorization.js';
import { LocalListAuthorization } from './authorization/local-list-authorization.js';
import { LocalListVersion } from './authorization/local-list-version.js';
import { LocalListVersionAuthorization } from './authorization/local-list-version-authorization.js';
import { SendLocalList } from './authorization/send-local-list.js';
import { SendLocalListAuthorization } from './authorization/send-local-list-authorization.js';
import { Boot } from './boot.js';
import { Certificate } from './certificate/certificate.js';
import { DeleteCertificateAttempt } from './certificate/delete-certificate-attempt.js';
import { InstallCertificateAttempt } from './certificate/install-certificate-attempt.js';
import { InstalledCertificate } from './certificate/installed-certificate.js';
import { ChangeConfiguration } from './change-configuration.js';
import { ChargingNeeds } from './charging-profile/charging-needs.js';
import { ChargingProfile } from './charging-profile/charging-profile.js';
import { ChargingSchedule } from './charging-profile/charging-schedule.js';
import { CompositeSchedule } from './charging-profile/composite-schedule.js';
import { SalesTariff } from './charging-profile/sales-tariff.js';
import { ChargingStationSecurityInfo } from './charging-station-security-info.js';
import { ChargingStationSequence } from './charging-station-sequence/charging-station-sequence.js';
import { Component } from './device-model/component.js';
import { ComponentVariable } from './device-model/component-variable.js';
import { EvseType } from './device-model/evse-type.js';
import { Variable } from './device-model/variable.js';
import { VariableAttribute } from './device-model/variable-attribute.js';
import { VariableCharacteristics } from './device-model/variable-characteristics.js';
import { VariableMonitoring } from './variable-monitoring/variable-monitoring.js';
import { VariableMonitoringStatus } from './variable-monitoring/variable-monitoring-status.js';
import { VariableStatus } from './device-model/variable-status.js';
import { ChargingStation } from './location/charging-station.js';
import { ChargingStationNetworkProfile } from './location/charging-station-network-profile.js';
import { Connector } from './location/connector.js';
import { Evse } from './location/evse.js';
import { LatestStatusNotification } from './location/latest-status-notification.js';
import { Location } from './location/location.js';
import { ServerNetworkProfile } from './location/server-network-profile.js';
import { SetNetworkProfile } from './location/set-network-profile.js';
import { StatusNotification } from './location/status-notification.js';
import { MessageInfo } from './message-info/message-info.js';
import { OCPPMessage } from './ocpp-message.js';
import { Reservation } from './reservation.js';
import { SecurityEvent } from './security-event.js';
import { Subscription } from './subscription/subscription.js';
import { Tariff } from './tariff/tariffs.js';
import { TenantPartner } from './tenant-partner.js';
import { MeterValue } from './transaction-event/meter-value.js';
import { StartTransaction } from './transaction-event/start-transaction.js';
import { StopTransaction } from './transaction-event/stop-transaction.js';
import { Transaction } from './transaction-event/transaction.js';
import { TransactionEvent } from './transaction-event/transaction-event.js';
import { EventData } from './variable-monitoring/event-data.js';

export enum TenantAttributeProps {
  id = 'id',
  tenantWebsocketServerPath = 'tenantWebsocketServerPath',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}

export interface TenantAttributes {
  [TenantAttributeProps.id]: string;
  [TenantAttributeProps.tenantWebsocketServerPath]?: string | null;
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
   * URL path segment this tenant is reachable under on every websocket server with
   * dynamicTenantResolution enabled. Unique so a path resolves to exactly one tenant.
   */
  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  declare tenantWebsocketServerPath: string | null;

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
