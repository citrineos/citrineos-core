// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  DEFAULT_TENANT_ID,
  ITenantDto,
  IVariableAttributeDto,
  IVariableStatusDto,
  OCPP2_0_1,
  OCPP2_0_1_Namespace,
} from '@citrineos/base';
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
export class VariableStatus extends Model implements IVariableStatusDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.VariableStatus;

  @Column(DataType.STRING(4000))
  declare value: string;

  @Column(DataType.STRING)
  declare status: string;

  @Column(DataType.JSON)
  declare statusInfo?: OCPP2_0_1.StatusInfoType | null;

  /**
   * Relations
   */

  @BelongsTo(() => VariableAttribute)
  declare variable: IVariableAttributeDto;

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

  @BelongsTo(() => Tenant)
  declare tenant?: ITenantDto;

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
