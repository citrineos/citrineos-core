// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { VariableMonitoring } from './VariableMonitoring';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class VariableMonitoringStatus extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.VariableMonitoringStatus;

  @Column(DataType.STRING)
  declare status: string;

  @Column(DataType.JSON)
  declare statusInfo?: OCPP2_0_1.StatusInfoType | null;

  /**
   * Relations
   */

  @BelongsTo(() => VariableMonitoring)
  declare variable: VariableMonitoring;

  @ForeignKey(() => VariableMonitoring)
  @Column(DataType.INTEGER)
  declare variableMonitoringId?: number | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
