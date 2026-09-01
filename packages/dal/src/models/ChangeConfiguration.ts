// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, OCPP1_6_Namespace } from '@citrineos/base';
import type { ChangeConfigurationDto, TenantDto } from '@citrineos/types';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Tenant } from './Tenant.js';

@Table
export class ChangeConfiguration extends Model implements ChangeConfigurationDto {
  static readonly MODEL_NAME: string = OCPP1_6_Namespace.ChangeConfiguration;

  @Column({
    unique: 'stationName_tenantId_key',
    allowNull: false,
    type: DataType.STRING,
  })
  declare ocppConnectionName: string;

  @Column({
    unique: 'stationName_tenantId_key',
    allowNull: false,
    type: DataType.STRING(50),
  })
  declare key: string;

  @Column(DataType.STRING(500))
  declare value?: string | null;

  @Column(DataType.BOOLEAN)
  declare readonly?: boolean | null;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    unique: 'stationName_tenantId_key',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: ChangeConfiguration) {
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
