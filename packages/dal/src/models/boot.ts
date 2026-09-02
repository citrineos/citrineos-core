// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  BootDto,
  ChargingStationDto,
  TenantDto,
  VariableAttributeDto,
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
import { VariableAttribute } from './device-model/variable-attribute.js';
import { ChargingStation } from './location/index.js';
import { Tenant } from './tenant.js';

@Table
export class Boot extends Model implements BootDto {
  static readonly MODEL_NAME: string = Namespace.BootConfig;

  @AutoIncrement
  @PrimaryKey
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: 'Boots_stationId_key',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  declare stationId: number;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation?: ChargingStationDto;

  @Column({
    type: DataType.DATE,
    get() {
      const lastBootTimeValue = this.getDataValue('lastBootTime');
      return lastBootTimeValue ? lastBootTimeValue.toISOString() : null;
    },
  })
  declare lastBootTime?: string | null;

  @Column(DataType.INTEGER)
  declare heartbeatInterval?: number | null;

  @Column(DataType.INTEGER)
  declare bootRetryInterval?: number | null;

  @Column(DataType.STRING)
  declare status: string;

  @Column(DataType.JSON)
  declare statusInfo?: object | null;

  @Column(DataType.BOOLEAN)
  declare getBaseReportOnPending?: boolean | null;

  /**
   * Variable attributes to be sent in SetVariablesRequest on pending boot
   */
  @HasMany(() => VariableAttribute, 'bootConfigId')
  declare pendingBootSetVariables?: VariableAttributeDto[];

  @Column(DataType.JSON)
  declare variablesRejectedOnLastBoot?: object[] | null;

  @Column(DataType.BOOLEAN)
  declare bootWithRejectedVariables?: boolean | null;

  @Column(DataType.BOOLEAN)
  declare changeConfigurationsOnPending?: boolean | null;

  @Column(DataType.BOOLEAN)
  declare getConfigurationsOnPending?: boolean | null;

  declare customData?: object | null;

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

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: Boot) {
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
