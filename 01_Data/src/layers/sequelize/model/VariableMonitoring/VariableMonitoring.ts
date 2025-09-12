// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IVariableMonitoringDto, OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Index,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Component, Variable } from '../DeviceModel';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class VariableMonitoring extends BaseModelWithTenant implements IVariableMonitoringDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.VariableMonitoringType;

  /**
   * Fields
   */

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Index
  @Column({
    unique: 'stationId_Id',
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_Id',
  })
  declare id: number;

  @Column(DataType.BOOLEAN)
  declare transaction: boolean;

  @Column(DataType.INTEGER)
  declare value: number;

  @Column(DataType.STRING)
  declare type: OCPP2_0_1.MonitorEnumType;

  @Column(DataType.INTEGER)
  declare severity: number;

  /**
   * Relations
   */

  @BelongsTo(() => Variable)
  declare variable: Variable;

  @ForeignKey(() => Variable)
  @Column({
    type: DataType.INTEGER,
  })
  declare variableId?: number | null;

  @BelongsTo(() => Component)
  declare component: Component;

  @ForeignKey(() => Component)
  @Column({
    type: DataType.INTEGER,
  })
  declare componentId?: number | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
