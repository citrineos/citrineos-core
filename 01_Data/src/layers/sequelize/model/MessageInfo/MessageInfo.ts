// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace, OCPP2_0_1 } from '@citrineos/base';
import { Table, Model, AutoIncrement, Column, DataType, PrimaryKey, Index, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Component } from '../DeviceModel';

@Table
export class MessageInfo extends Model implements OCPP2_0_1.MessageInfoType {
  static readonly MODEL_NAME: string = Namespace.MessageInfoType;

  /**
   * Fields
   */

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Index
  @Column({
    unique: 'stationId_id',
  })
  declare stationId: string;

  @Column({
    unique: 'stationId_id',
    type: DataType.INTEGER,
  })
  declare id: number;

  @Column(DataType.STRING)
  declare priority: OCPP2_0_1.MessagePriorityEnumType;

  @Column(DataType.STRING)
  declare state?: OCPP2_0_1.MessageStateEnumType | null;

  @Column({
    type: DataType.DATE,
    get() {
      const startDateTime: Date = this.getDataValue('startDateTime');
      return startDateTime ? startDateTime.toISOString() : null;
    },
  })
  declare startDateTime?: string | null;

  @Column({
    type: DataType.DATE,
    get() {
      const endDateTime: Date = this.getDataValue('endDateTime');
      return endDateTime ? endDateTime.toISOString() : null;
    },
  })
  declare endDateTime?: string | null;

  @Column(DataType.STRING)
  declare transactionId?: string | null;

  @Column(DataType.JSON)
  declare message: OCPP2_0_1.MessageContentType;

  @Column(DataType.BOOLEAN)
  declare active: boolean;

  /**
   * Relations
   */

  @BelongsTo(() => Component)
  declare display: OCPP2_0_1.ComponentType;

  @ForeignKey(() => Component)
  @Column({
    type: DataType.INTEGER,
  })
  declare displayComponentId?: number | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
