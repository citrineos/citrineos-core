// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ChargingStationCapabilityEnumType,
  ChargingStationDto,
  ChargingStationParkingRestrictionEnumType,
  ConnectorDto,
  EvseDto,
  LocationDto,
  TenantDto,
  TransactionDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, Namespace, OCPPVersion } from '@citrineos/base';
import type { Point } from 'geojson';
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
import { Tenant } from '../Tenant.js';
import { Transaction } from '../index.js';
import { ChargingStationNetworkProfile } from './ChargingStationNetworkProfile.js';
import { Connector } from './Connector.js';
import { Evse } from './Evse.js';
import { Location } from './Location.js';
import { SetNetworkProfile } from './SetNetworkProfile.js';
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

  @ForeignKey(() => Location)
  @Column(DataType.INTEGER)
  declare locationId?: number | null;

  @HasMany(() => StatusNotification)
  declare statusNotifications?: StatusNotification[] | null;

  @HasMany(() => Transaction)
  declare transactions?: TransactionDto[] | null;

  /**
   * The business Location of the charging station. Optional in case a charging station is not yet in the field, or retired.
   */
  @BelongsTo(() => Location)
  declare location?: LocationDto;

  @BelongsToMany(() => SetNetworkProfile, () => ChargingStationNetworkProfile)
  declare networkProfiles?: SetNetworkProfile[] | null;

  @HasMany(() => Evse, {
    onDelete: 'CASCADE',
  })
  declare evses?: EvseDto[] | null;

  @HasMany(() => Connector, {
    onDelete: 'CASCADE',
  })
  declare connectors?: ConnectorDto[] | null;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: ChargingStation) {
    if (instance.tenantId == null) {
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
