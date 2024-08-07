// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type CustomDataType, type MeterValueType, Namespace, type SampledValueType } from '@citrineos/base';
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TransactionEvent } from './TransactionEvent';
import { Transaction } from './Transaction';

@Table
export class MeterValue extends Model implements MeterValueType {
  static readonly MODEL_NAME: string = Namespace.MeterValueType;

  @ForeignKey(() => TransactionEvent)
  @Column(DataType.INTEGER)
  declare transactionEventId?: number | null;

  @ForeignKey(() => Transaction)
  @Column(DataType.INTEGER)
  declare transactionDatabaseId?: number | null;

  @Column(DataType.JSON)
  declare sampledValue: [SampledValueType, ...SampledValueType[]];

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  declare customData?: CustomDataType | null;
}
