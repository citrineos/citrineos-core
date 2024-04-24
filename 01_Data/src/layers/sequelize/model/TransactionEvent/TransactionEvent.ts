// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type CustomDataType, EVSEType, Namespace, TransactionEventEnumType, type TransactionEventRequest, TransactionType, TriggerReasonEnumType } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { IdToken } from '../Authorization';
import { Evse } from '../DeviceModel';
import { MeterValue } from './MeterValue';
import { Transaction } from './Transaction';

@Table
export class TransactionEvent extends Model implements TransactionEventRequest {
  static readonly MODEL_NAME: string = Namespace.TransactionEventRequest;

  @Column
  declare stationId: string;

  @Column(DataType.STRING)
  declare eventType: TransactionEventEnumType;

  @HasMany(() => MeterValue)
  declare meterValue?: [MeterValue, ...MeterValue[]];

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  @Column
  declare triggerReason: TriggerReasonEnumType;

  @Column(DataType.INTEGER)
  declare seqNo: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare offline?: boolean;

  @Column(DataType.INTEGER)
  declare numberOfPhasesUsed?: number;

  @Column(DataType.DECIMAL)
  declare cableMaxCurrent?: number;

  @Column(DataType.INTEGER)
  declare reservationId?: number;

  @ForeignKey(() => Transaction)
  declare transactionDatabaseId?: string;

  @BelongsTo(() => Transaction)
  declare transaction?: TransactionType;

  @Column(DataType.JSON)
  declare transactionInfo: TransactionType;

  @ForeignKey(() => Evse)
  declare evseId?: number;

  @BelongsTo(() => Evse)
  declare evse?: EVSEType;

  @ForeignKey(() => IdToken)
  declare idTokenId?: number;

  @BelongsTo(() => IdToken)
  declare idToken?: IdToken;

  declare customData?: CustomDataType;
}
