// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ChargingStationCapabilityEnumType,
  ChargingStationDto,
  ChargingStationParkingRestrictionEnumType,
  ChargingStationSecurityInfoDto,
  ChargingStationSequenceDto,
  ConnectorDto,
  EvseDto,
  InstalledCertificateDto,
  LocationDto,
  OCPPMessageDto,
  Point,
  ServerNetworkProfileDto,
  StatusNotificationDto,
  TenantDto,
  VariableAttributeDto,
  VariableMonitoringDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, Namespace, OCPPVersion } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { DeleteCertificateAttempt } from '../Certificate/DeleteCertificateAttempt.js';
import { InstalledCertificate } from '../Certificate/InstalledCertificate.js';
import { ChargingStationSecurityInfo } from '../ChargingStationSecurityInfo.js';
import { ChargingStationSequence } from '../ChargingStationSequence/ChargingStationSequence.js';
import { VariableAttribute } from '../DeviceModel/VariableAttribute.js';
import { OCPPMessage } from '../OCPPMessage.js';
import { Tenant } from '../Tenant.js';
import { Transaction } from '../TransactionEvent/Transaction.js';
import { EventData } from '../VariableMonitoring/EventData.js';
import { VariableMonitoring } from '../VariableMonitoring/VariableMonitoring.js';
import { ChargingStationNetworkProfile } from './ChargingStationNetworkProfile.js';
import { Connector } from './Connector.js';
import { Evse } from './Evse.js';
import { Location } from './Location.js';
import { ServerNetworkProfile } from './ServerNetworkProfile.js';
import { StatusNotification } from './StatusNotification.js';

/**
 * Represents a charging station.
 * Currently, this data model is internal to CitrineOS. In the future, it will be analogous to an OCPI ChargingStation.
 */
@Table
export class ChargingStation extends Model implements ChargingStationDto {
  static readonly MODEL_NAME: string = Namespace.ChargingStation;

  @PrimaryKey
  @Column(DataType.STRING(36))
  declare id: string;

  @Column(DataType.BOOLEAN)
  declare isOnline: boolean;

  @Column(DataType.STRING)
  declare protocol?: OCPPVersion | null;

  @Column(DataType.DATE)
  declare latestOcppMessageTimestamp?: string | null;

  @Column(DataType.STRING(20))
  declare chargePointVendor?: string | null;

  @Column(DataType.STRING(20))
  declare chargePointModel?: string | null;

  @Column(DataType.STRING(25))
  declare chargePointSerialNumber?: string | null;

  @Column(DataType.STRING(25))
  declare chargeBoxSerialNumber?: string | null;

  @Column(DataType.STRING(50))
  declare firmwareVersion?: string | null;

  @Column(DataType.STRING(20))
  declare iccid?: string | null;

  @Column(DataType.STRING(20))
  declare imsi?: string | null;

  @Column(DataType.STRING(25))
  declare meterType?: string | null;

  @Column(DataType.STRING(25))
  declare meterSerialNumber?: string | null;

  /**
   * [longitude, latitude]
   */
  @Column(DataType.GEOMETRY('POINT'))
  declare coordinates?: Point | null;

  @Column(DataType.STRING)
  declare floorLevel?: string | null;

  @Column(DataType.JSONB)
  declare parkingRestrictions?: ChargingStationParkingRestrictionEnumType[] | null;

  @Column(DataType.JSONB)
  declare capabilities?: ChargingStationCapabilityEnumType[] | null;

  /**
   * In OCPP 1.6, StatusNotifications can be sent with a connectorId of 0 to report the status of the whole charging station.
   * Some charging stations instead use it in ways that cannot be applied to all connectors
   * (such as sending Available when at least one connector is available, while others are charging).
   * When true, this flag indicates that StatusNotifications with connectorId 0 should be used to update all connector statuses.
   * When false, StatusNotifications with connectorId 0 should be ignored.
   */
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare use16StatusNotification0: boolean;

  @ForeignKey(() => Location)
  @Column(DataType.INTEGER)
  declare locationId?: number | null;

  @HasMany(() => StatusNotification, 'stationId')
  declare statusNotifications?: StatusNotificationDto[] | null;

  @HasMany(() => InstalledCertificate, 'stationId')
  declare installedCertificates?: InstalledCertificateDto[];

  @HasMany(() => Transaction, 'stationId')
  declare transactions?: Transaction[] | null;

  /**
   * The business Location of the charging station. Optional in case a charging station is not yet in the field, or retired.
   */
  @BelongsTo(() => Location, 'locationId')
  declare location?: LocationDto;

  @BelongsToMany(() => ServerNetworkProfile, () => ChargingStationNetworkProfile)
  declare networkProfiles?: ServerNetworkProfileDto[] | null;

  @HasMany(() => Evse, 'stationId')
  declare evses?: EvseDto[] | null;

  @HasMany(() => Connector, 'stationId')
  declare connectors?: ConnectorDto[] | null;

  @HasMany(() => VariableAttribute, 'stationId')
  declare variableAttributes?: VariableAttributeDto[];

  @HasMany(() => OCPPMessage, 'stationId')
  declare ocppMessages?: OCPPMessageDto[];

  @HasMany(() => VariableMonitoring, 'stationId')
  declare variableMonitorings?: VariableMonitoringDto[];

  @HasMany(() => EventData, 'stationId')
  declare stationEventData?: EventData[];

  @HasMany(() => ChargingStationSecurityInfo, 'stationId')
  declare securityInfo?: ChargingStationSecurityInfoDto[];

  @HasMany(() => ChargingStationSequence, 'stationId')
  declare sequences?: ChargingStationSequenceDto[];

  @HasMany(() => DeleteCertificateAttempt, 'stationId')
  declare deleteCertificateAttempts?: DeleteCertificateAttempt[];

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

  @BeforeCreate
  @BeforeUpdate
  static setDefaultTenant(instance: ChargingStation) {
    if (instance.isNewRecord && instance.tenantId == null) {
      instance.tenantId = DEFAULT_TENANT_ID;
    }
  }

  constructor(...args: any[]) {
    super(...args);
    if (this.tenantId == null) {
      this.tenantId = DEFAULT_TENANT_ID;
    }
  }
}
