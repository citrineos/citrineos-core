// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IStartTransactionDto, OCPP1_6_Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { Transaction } from './Transaction';
import { Connector } from '../Location';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class StartTransaction extends BaseModelWithTenant implements IStartTransactionDto {
  static readonly MODEL_NAME: string = OCPP1_6_Namespace.StartTransaction;

  @Column(DataType.STRING)
  declare stationId: string;

  @Column(DataType.INTEGER)
  declare meterStart: number; // in Wh

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp')?.toISOString();
    },
  })
  declare timestamp: string;

  @Column(DataType.INTEGER)
  declare reservationId?: number | null;

  @ForeignKey(() => Transaction)
  @Column({
    type: DataType.INTEGER,
    unique: true,
  })
  declare transactionDatabaseId: number;

  @BelongsTo(() => Transaction)
  declare transaction: Transaction;

  @ForeignKey(() => Connector)
  declare connectorDatabaseId: number;

  @BelongsTo(() => Connector)
  declare connector: Connector;
}
