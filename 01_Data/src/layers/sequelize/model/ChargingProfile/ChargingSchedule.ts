// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  DEFAULT_TENANT_ID,
  IChargingProfileDto,
  IChargingScheduleDto,
  ITenantDto,
  Namespace,
} from '@citrineos/base';
import {
  AutoIncrement,
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { ChargingProfile } from './ChargingProfile.js';
import { SalesTariff } from './SalesTariff.js';
import { Tenant } from '../Tenant.js';

@Table
export class ChargingSchedule extends Model implements IChargingScheduleDto {
  static readonly MODEL_NAME: string = Namespace.ChargingSchedule;

  /**
   * Fields
   */
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_id',
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    unique: 'stationId_id',
  })
  declare stationId: string;

  @Column(DataType.STRING)
  declare chargingRateUnit: string;

  @Column(DataType.JSONB)
  declare chargingSchedulePeriod: [any, ...any[]];

  @Column(DataType.INTEGER)
  declare duration?: number | null;

  @Column(DataType.DECIMAL)
  declare minChargingRate?: number | null;

  @Column(DataType.STRING)
  declare startSchedule?: string | null;

  // Periods contained in the charging profile are relative to this point in time.
  // From NotifyEVChargingScheduleRequest
  @Column({
    type: DataType.DATE,
    get() {
      const timeBase: Date = this.getDataValue('timeBase');
      return timeBase ? timeBase.toISOString() : null;
    },
  })
  declare timeBase?: string;

  /**
   * Relations
   */
  @BelongsTo(() => ChargingProfile)
  declare chargingProfile: IChargingProfileDto;

  @ForeignKey(() => ChargingProfile)
  @Column(DataType.INTEGER)
  declare chargingProfileDatabaseId?: number;

  @HasOne(() => SalesTariff)
  declare salesTariff?: SalesTariff;

  declare customData?: object | null;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: ITenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: ChargingSchedule) {
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
