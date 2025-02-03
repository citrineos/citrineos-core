// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TransactionEvent } from './TransactionEvent';
import { Transaction } from './Transaction';
import { Connector } from '../Location';

@Table
export class MeterValue extends Model {
  static readonly MODEL_NAME: string = Namespace.MeterValue;

  @ForeignKey(() => TransactionEvent)
  @Column(DataType.INTEGER)
  declare transactionEventId?: number | null;

  @ForeignKey(() => Transaction)
  @Column(DataType.INTEGER)
  declare transactionDatabaseId?: number | null;

  @Column(DataType.JSON)
  declare sampledValue: [object, ...object[]];

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  @ForeignKey(() => Connector)
  declare connectorDatabaseId?: number;

  @BelongsTo(() => Connector)
  declare connector?: Connector;

  declare customData?: object | null;
}
