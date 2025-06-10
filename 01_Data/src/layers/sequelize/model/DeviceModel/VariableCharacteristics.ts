// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { Variable } from './Variable';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class VariableCharacteristics
  extends BaseModelWithTenant
  implements OCPP2_0_1.VariableCharacteristicsType
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
  declare variable: OCPP2_0_1.VariableType;

  @ForeignKey(() => Variable)
  @Column({
    type: DataType.INTEGER,
    unique: true,
  })
  declare variableId?: number | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
