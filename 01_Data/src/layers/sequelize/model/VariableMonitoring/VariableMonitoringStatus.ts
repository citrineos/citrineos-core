// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type CustomDataType, Namespace, StatusInfoType } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { VariableMonitoring } from './VariableMonitoring';

@Table
export class VariableMonitoringStatus extends Model {
  static readonly MODEL_NAME: string = Namespace.VariableMonitoringStatus;

  @Column(DataType.STRING)
  declare status: string;

  @Column(DataType.JSON)
  declare statusInfo?: StatusInfoType;

  /**
   * Relations
   */

  @BelongsTo(() => VariableMonitoring)
  declare variable: VariableMonitoring;

  @ForeignKey(() => VariableMonitoring)
  @Column(DataType.INTEGER)
  declare variableMonitoringId?: number;

  declare customData?: CustomDataType;
}
