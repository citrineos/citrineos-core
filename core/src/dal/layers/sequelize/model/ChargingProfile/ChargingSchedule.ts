// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ChargingProfileDto,
  ChargingRateUnitEnumType,
  ChargingScheduleDto,
  SalesTariffDto,
  TenantDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import {
  AutoIncrement,
  BeforeCreate,
  BeforeUpdate,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table
export class ChargingSchedule extends Model implements ChargingScheduleDto {
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
    unique: 'stationId_tenantId_id',
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    unique: 'stationId_tenantId_id',
  })
  declare stationId: string;

  @Column(DataType.STRING)
  declare chargingRateUnit: ChargingRateUnitEnumType;

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
  declare chargingProfile: ChargingProfileDto;

  @Column(DataType.INTEGER)
  declare chargingProfileDatabaseId?: number;

  declare salesTariff?: SalesTariffDto;

  declare customData?: object | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    unique: 'stationId_tenantId_id',
  })
  declare tenantId: number;

  declare tenant?: TenantDto;

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
