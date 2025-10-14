// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IMeterValueDto, Namespace, SampledValue } from '@citrineos/base';
import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { TransactionEvent } from './TransactionEvent';
import { Transaction } from './Transaction';
import { StopTransaction } from './StopTransaction';
import { BaseModelWithTenant } from '../BaseModelWithTenant';
import { Tariff } from '../Tariff';

@Table
export class MeterValue extends BaseModelWithTenant implements IMeterValueDto {
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

  @Column(DataType.JSONB)
  declare sampledValue: [SampledValue, ...SampledValue[]];

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

  @ForeignKey(() => Tariff)
  @Column(DataType.INTEGER)
  declare tariffId?: number | null;

  @Column(DataType.STRING)
  declare transactionId?: string | null;
}
