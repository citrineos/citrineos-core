// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type VariableAttributeDto,
  type VariableStatusDto,
  type TenantDto,
  type StatusInfo,
  OCPP2_0_1,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, OCPP2_Namespace } from '@citrineos/base';
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
import { VariableAttribute } from './VariableAttribute.js';
import { Tenant } from '../Tenant.js';

@Table
export class VariableStatus extends Model implements VariableStatusDto {
  static readonly MODEL_NAME: string = OCPP2_Namespace.VariableStatus;

  @Column(DataType.STRING(4000))
  declare value: string;

  @Column(DataType.STRING)
  declare status: string;

  @Column(DataType.JSON)
  declare statusInfo?: StatusInfo | null;

  /**
   * Relations
   */

  @BelongsTo(() => VariableAttribute, 'variableAttributeId')
  declare variable: VariableAttributeDto;

  @ForeignKey(() => VariableAttribute)
  @Column(DataType.INTEGER)
  declare variableAttributeId?: number | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;

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
  static setDefaultTenant(instance: VariableStatus) {
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
