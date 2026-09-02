// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ChargingLimitSourceEnumType,
  ChargingProfileDto,
  ChargingProfileKindEnumType,
  ChargingProfilePurposeEnumType,
  ChargingScheduleDto,
  RecurrencyKindEnumType,
  TenantDto,
  TransactionDto,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import {
  AutoIncrement,
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Transaction } from '../transaction-event/transaction.js';
import { ChargingSchedule } from './charging-schedule.js';
import { Tenant } from '../tenant.js';

@Table
export class ChargingProfile extends Model implements ChargingProfileDto {
  static readonly MODEL_NAME: string = Namespace.ChargingProfile;

  /**
   * Fields
   */
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Column({
    type: DataType.STRING,
    unique: 'stationName_tenantId_id',
  })
  declare ocppConnectionName: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationName_tenantId_id',
  })
  declare id: number;

  @Column(DataType.STRING)
  declare chargingProfileKind: ChargingProfileKindEnumType;

  @Column(DataType.STRING)
  declare chargingProfilePurpose: ChargingProfilePurposeEnumType;

  @Column(DataType.STRING)
  declare recurrencyKind?: RecurrencyKindEnumType | null;

  @Column(DataType.INTEGER)
  declare stackLevel: number;

  @Column({
    type: DataType.DATE,
    get() {
      const validFrom: Date = this.getDataValue('validFrom');
      return validFrom ? validFrom.toISOString() : null;
    },
  })
  declare validFrom?: string | null;

  @Column({
    type: DataType.DATE,
    get() {
      const validTo: Date = this.getDataValue('validTo');
      return validTo ? validTo.toISOString() : null;
    },
  })
  declare validTo?: string | null;

  @Column(DataType.INTEGER)
  declare evseId?: number | null;

  // this value indicates whether the ChargingProfile is set on charger
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: 'CSO',
  })
  declare chargingLimitSource?: ChargingLimitSourceEnumType | null;

  /**
   * Relations
   */
  @HasMany(() => ChargingSchedule, 'chargingProfileDatabaseId')
  declare chargingSchedule:
    | [ChargingScheduleDto]
    | [ChargingScheduleDto, ChargingScheduleDto]
    | [ChargingScheduleDto, ChargingScheduleDto, ChargingScheduleDto];

  @ForeignKey(() => Transaction)
  declare transactionDatabaseId?: number | null;

  @BelongsTo(() => Transaction, 'transactionDatabaseId')
  declare transaction?: TransactionDto;

  declare customData?: object | null;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    unique: 'stationName_tenantId_id',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: ChargingProfile) {
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
