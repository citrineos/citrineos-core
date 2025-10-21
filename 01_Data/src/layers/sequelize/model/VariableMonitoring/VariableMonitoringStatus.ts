// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  VariableMonitoringDto,
  VariableMonitoringStatusDto,
  TenantDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
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
import { Tenant } from '../Tenant.js';
import { VariableMonitoring } from './VariableMonitoring.js';

@Table
export class VariableMonitoringStatus extends Model implements VariableMonitoringStatusDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.VariableMonitoringStatus;

  @Column(DataType.STRING)
  declare status: string;

  @Column(DataType.JSON)
  declare statusInfo?: OCPP2_0_1.StatusInfoType | null;

  /**
   * Relations
   */

  @BelongsTo(() => VariableMonitoring)
  declare variable: VariableMonitoringDto;

  @ForeignKey(() => VariableMonitoring)
  @Column(DataType.INTEGER)
  declare variableMonitoringId?: number | null;

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
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: VariableMonitoringStatus) {
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
