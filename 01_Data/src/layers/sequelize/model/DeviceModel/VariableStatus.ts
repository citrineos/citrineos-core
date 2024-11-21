// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace, OCPP2_0_1 } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { VariableAttribute } from './VariableAttribute';

@Table
export class VariableStatus extends Model {
  static readonly MODEL_NAME: string = Namespace.VariableStatus;

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
  declare variable: VariableAttribute;

  @ForeignKey(() => VariableAttribute)
  @Column(DataType.INTEGER)
  declare variableAttributeId?: number | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
