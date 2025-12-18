// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootDto, TenantDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import {
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
import { VariableAttribute } from './DeviceModel/index.js';
import { Tenant } from './Tenant.js';

@Table
export class Boot extends Model implements BootDto {
  static readonly MODEL_NAME: string = Namespace.BootConfig;

  /**
   * StationId
   */
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

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
  @HasMany(() => VariableAttribute)
  declare pendingBootSetVariables?: VariableAttribute[];

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

  @BelongsTo(() => Tenant)
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
