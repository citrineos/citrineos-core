// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
import { OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Index, Table } from 'sequelize-typescript';
import { Component, Variable } from '../DeviceModel';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class EventData extends BaseModelWithTenant implements OCPP2_0_1.EventDataType {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.EventDataType;

  /**
   * Fields
   */
  @Index
  @Column({
    type: DataType.STRING,
    unique: 'stationId_eventId',
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_eventId',
  })
  declare eventId: number;

  @Column(DataType.STRING)
  declare trigger: OCPP2_0_1.EventTriggerEnumType;

  @Column(DataType.INTEGER)
  declare cause?: number | null;

  @Column({
    type: DataType.DATE,
    get() {
      const timestamp: Date = this.getDataValue('timestamp');
      return timestamp ? timestamp.toISOString() : null;
    },
  })
  declare timestamp: string;

  @Column(DataType.STRING)
  declare actualValue: string;

  @Column(DataType.STRING)
  declare techCode?: string | null;

  @Column(DataType.STRING)
  declare techInfo?: string | null;

  @Column(DataType.BOOLEAN)
  declare cleared?: boolean | null;

  @Column(DataType.STRING)
  declare transactionId?: string | null;

  @Column(DataType.INTEGER)
  declare variableMonitoringId?: number | null;

  @Column(DataType.STRING)
  declare eventNotificationType: OCPP2_0_1.EventNotificationEnumType;

  /**
   * Relations
   */
  @BelongsTo(() => Variable)
  declare variable: OCPP2_0_1.VariableType;

  @ForeignKey(() => Variable)
  @Column({
    type: DataType.INTEGER,
  })
  declare variableId?: number;

  @BelongsTo(() => Component)
  declare component: OCPP2_0_1.ComponentType;

  @ForeignKey(() => Component)
  @Column({
    type: DataType.INTEGER,
  })
  declare componentId?: number;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
