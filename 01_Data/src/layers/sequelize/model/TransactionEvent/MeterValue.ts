// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { TransactionEvent } from './TransactionEvent';
import { Transaction } from './Transaction';
import { StopTransaction } from './StopTransaction';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class MeterValue extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = Namespace.MeterValue;

  @ForeignKey(() => TransactionEvent)
  @Column(DataType.INTEGER)
  declare transactionEventId?: number | null;

  @ForeignKey(() => Transaction)
  @Column(DataType.INTEGER)
  declare transactionDatabaseId?: number | null;

  @ForeignKey(() => StopTransaction)
  @Column(DataType.INTEGER)
  declare stopTransactionDatabaseId?: number | null;

  @Column(DataType.JSON)
  declare sampledValue: [object, ...object[]];

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  @Column(DataType.INTEGER)
  declare connectorId?: number;

  declare customData?: any | null;
}
