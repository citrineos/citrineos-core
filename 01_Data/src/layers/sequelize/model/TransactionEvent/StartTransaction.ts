// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6_Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { Transaction } from './Transaction';
import { IdToken } from '../Authorization';
import { Connector } from '../Location';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class StartTransaction extends BaseModelWithTenant {
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
  declare transactionDatabaseId: string;

  @BelongsTo(() => Transaction)
  declare transaction: Transaction;

  @ForeignKey(() => IdToken)
  declare idTokenDatabaseId?: number | null;

  @BelongsTo(() => IdToken)
  declare idToken?: IdToken;

  @ForeignKey(() => Connector)
  declare connectorDatabaseId: number;

  @BelongsTo(() => Connector)
  declare connector: Connector;
}
