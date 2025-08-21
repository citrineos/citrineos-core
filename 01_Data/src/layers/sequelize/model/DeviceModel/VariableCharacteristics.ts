// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  DEFAULT_TENANT_ID,
  ITenantDto,
  IVariableCharacteristicsDto,
  IVariableDto,
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
import { Variable } from './Variable.js';
import { Tenant } from '../Tenant.js';

@Table
export class VariableCharacteristics
  extends Model
  implements OCPP2_0_1.VariableCharacteristicsType, IVariableCharacteristicsDto
{
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.VariableCharacteristicsType;

  /**
   * Fields
   */

  @Column(DataType.STRING)
  declare unit?: string | null;

  @Column(DataType.STRING)
  declare dataType: OCPP2_0_1.DataEnumType;

  @Column(DataType.DECIMAL)
  declare minLimit?: number | null;

  @Column(DataType.DECIMAL)
  declare maxLimit?: number | null;

  @Column(DataType.STRING(4000))
  declare valuesList?: string | null;

  @Column
  declare supportsMonitoring: boolean;

  /**
   * Relations
   */

  @BelongsTo(() => Variable)
  declare variable: IVariableDto;

  @ForeignKey(() => Variable)
  @Column({
    type: DataType.INTEGER,
    unique: true,
  })
  declare variableId?: number | null;

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
  static setDefaultTenant(instance: VariableCharacteristics) {
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
