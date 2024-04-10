// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ChargingStateEnumType, type CustomDataType, EVSEType, type MeterValueType, Namespace, ReasonEnumType, type TransactionEventRequest, type TransactionType } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { MeterValue } from './MeterValue';
import { TransactionEvent } from './TransactionEvent';
import { Evse } from '../DeviceModel';

@Table
export class Transaction extends Model implements TransactionType {
  static readonly MODEL_NAME: string = Namespace.TransactionType;

  @Column({
    unique: 'stationId_transactionId',
  })
  declare stationId: string;

  @BelongsTo(() => Evse)
  declare evse?: EVSEType;

  @ForeignKey(() => Evse)
  @Column(DataType.INTEGER)
  declare evseDatabaseId?: number;

  @Column({
    unique: 'stationId_transactionId',
  })
  declare transactionId: string;

  @Column({
    defaultValue: true,
  })
  declare isActive: boolean;

  @HasMany(() => TransactionEvent)
  declare transactionEvents?: TransactionEventRequest[];

  @HasMany(() => MeterValue)
  declare meterValues?: MeterValueType[];

  @Column(DataType.STRING)
  declare chargingState?: ChargingStateEnumType;

  @Column(DataType.BIGINT)
  declare timeSpentCharging?: number;

  @Column(DataType.DECIMAL)
  declare totalKwh?: number;

  @Column(DataType.STRING)
  declare stoppedReason?: ReasonEnumType;

  @Column(DataType.INTEGER)
  declare remoteStartId?: number;

  declare customData?: CustomDataType;
}
