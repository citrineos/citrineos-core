// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1_Namespace, OCPP2_0_1 } from '@citrineos/base';
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TransactionEvent } from './TransactionEvent';
import { Transaction } from './Transaction';

@Table
export class MeterValue extends Model implements OCPP2_0_1.MeterValueType {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.MeterValueType;

  @ForeignKey(() => TransactionEvent)
  @Column(DataType.INTEGER)
  declare transactionEventId?: number | null;

  @ForeignKey(() => Transaction)
  @Column(DataType.INTEGER)
  declare transactionDatabaseId?: number | null;

  @Column(DataType.JSON)
  declare sampledValue: [OCPP2_0_1.SampledValueType, ...OCPP2_0_1.SampledValueType[]];

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
