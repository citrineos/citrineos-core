// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6_Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript';
import { Transaction } from './Transaction';
import { IdToken } from '../Authorization';
import { MeterValue } from './MeterValue';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class StopTransaction extends BaseModelWithTenant {
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

  @ForeignKey(() => IdToken)
  declare idTokenDatabaseId?: number | null;

  @BelongsTo(() => IdToken)
  declare idToken?: IdToken;

  @Column(DataType.STRING)
  declare reason?: string;

  @HasMany(() => MeterValue)
  declare meterValues?: MeterValue[];
}
