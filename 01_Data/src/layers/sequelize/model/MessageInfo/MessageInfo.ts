// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace, CustomDataType, ComponentType, MessageInfoType, MessagePriorityEnumType, MessageStateEnumType, MessageContentType } from '@citrineos/base';
import { Table, Model, AutoIncrement, Column, DataType, PrimaryKey, Index, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Component } from '../DeviceModel';

@Table
export class MessageInfo extends Model implements MessageInfoType {
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
  declare priority: MessagePriorityEnumType;

  @Column(DataType.STRING)
  declare state?: MessageStateEnumType;

  @Column({
    type: DataType.DATE,
    get() {
      const startDateTime: Date = this.getDataValue('startDateTime');
      return startDateTime ? startDateTime.toISOString() : null;
    },
  })
  declare startDateTime?: string;

  @Column({
    type: DataType.DATE,
    get() {
      const endDateTime: Date = this.getDataValue('endDateTime');
      return endDateTime ? endDateTime.toISOString() : null;
    },
  })
  declare endDateTime?: string;

  @Column(DataType.STRING)
  declare transactionId?: string;

  @Column(DataType.JSON)
  declare message: MessageContentType;

  @Column(DataType.BOOLEAN)
  declare active: boolean;

  /**
   * Relations
   */

  @BelongsTo(() => Component)
  declare component: ComponentType;

  @ForeignKey(() => Component)
  @Column({
    type: DataType.INTEGER,
  })
  declare componentId?: number;

  declare customData?: CustomDataType;
}
