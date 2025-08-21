// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  DEFAULT_TENANT_ID,
  IChargingScheduleDto,
  ISalesTariffDto,
  ITenantDto,
  OCPP2_0_1,
  OCPP2_0_1_Namespace,
} from '@citrineos/base';
import {
  AutoIncrement,
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { ChargingSchedule } from './ChargingSchedule.js';
import { Tenant } from '../Tenant.js';

@Table
export class SalesTariff extends Model implements ISalesTariffDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.SalesTariff;

  /**
   * Fields
   */
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Column({
    type: DataType.INTEGER,
    unique: 'id_chargingScheduleDatabaseId',
  })
  declare id: number;

  @Column(DataType.INTEGER)
  declare numEPriceLevels?: number | null;

  @Column(DataType.STRING)
  declare salesTariffDescription?: string | null;

  @Column(DataType.JSONB)
  declare salesTariffEntry: [OCPP2_0_1.SalesTariffEntryType, ...OCPP2_0_1.SalesTariffEntryType[]];

  /**
   * Relations
   */
  @ForeignKey(() => ChargingSchedule)
  @Column({
    type: DataType.INTEGER,
    unique: 'id_chargingScheduleDatabaseId',
  })
  declare chargingScheduleDatabaseId: number;

  @BelongsTo(() => ChargingSchedule)
  declare chargingSchedule: IChargingScheduleDto;

  declare customData?: OCPP2_0_1.CustomDataType | null;

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
  static setDefaultTenant(instance: SalesTariff) {
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
