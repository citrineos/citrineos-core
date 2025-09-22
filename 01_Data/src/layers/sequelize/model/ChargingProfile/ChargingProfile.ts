// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IChargingProfileDto, ITenantDto, ITransactionDto } from '@citrineos/base';
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
import { Transaction } from '../TransactionEvent/index.js';
import { ChargingSchedule } from './ChargingSchedule.js';
import { Tenant } from '../Tenant.js';

@Table
export class ChargingProfile extends Model implements IChargingProfileDto {
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
    unique: 'stationId_id',
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_id',
  })
  declare id: number;

  @Column(DataType.STRING)
  declare chargingProfileKind: string;

  @Column(DataType.STRING)
  declare chargingProfilePurpose: string;

  @Column(DataType.STRING)
  declare recurrencyKind?: string | null;

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
  declare chargingLimitSource?: string | null;

  /**
   * Relations
   */
  @HasMany(() => ChargingSchedule)
  declare chargingSchedule:
    | [ChargingSchedule]
    | [ChargingSchedule, ChargingSchedule]
    | [ChargingSchedule, ChargingSchedule, ChargingSchedule];

  @ForeignKey(() => Transaction)
  declare transactionDatabaseId?: number | null;

  @BelongsTo(() => Transaction)
  declare transaction?: ITransactionDto;

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
