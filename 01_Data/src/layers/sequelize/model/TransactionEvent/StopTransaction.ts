// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IStopTransactionDto, OCPP1_6_Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript';
import { Transaction } from './Transaction';
import { MeterValue } from './MeterValue';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class StopTransaction extends BaseModelWithTenant implements IStopTransactionDto {
  static readonly MODEL_NAME: string = OCPP1_6_Namespace.StopTransaction;

  @Column(DataType.STRING)
  declare stationId: string;

  @ForeignKey(() => Transaction)
  @Column({
    type: DataType.INTEGER,
    unique: true,
  })
  declare transactionDatabaseId: string;

  @BelongsTo(() => Transaction)
  declare transaction: Transaction;

  @Column(DataType.INTEGER)
  declare meterStop: number;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp')?.toISOString();
    },
  })
  declare timestamp: string;

  @Column(DataType.STRING)
  declare reason?: string;

  @HasMany(() => MeterValue)
  declare meterValues?: MeterValue[];

  // Add flat idToken fields
  @Column(DataType.STRING)
  declare idTokenValue?: string;

  @Column(DataType.STRING)
  declare idTokenType?: string;
}
