// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ChargingStateEnumType, type CustomDataType, EVSEType, type MeterValueType, Namespace, ReasonEnumType, type TransactionEventRequest, type TransactionType } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { MeterValue } from './MeterValue';
import { TransactionEvent } from './TransactionEvent';
import { Evse } from '../DeviceModel';
import { ChargingStation } from '../Location';

@Table
export class Transaction extends Model implements TransactionType {
  static readonly MODEL_NAME: string = Namespace.TransactionType;
  static readonly TRANSACTION_EVENTS_ALIAS = 'transactionEvents';
  static readonly TRANSACTION_EVENTS_FILTER_ALIAS = 'transactionEventsFilter';

  @Column({
    unique: 'stationId_transactionId',
  })
  @ForeignKey(() => ChargingStation)
  stationId!: string;

  @BelongsTo(() => ChargingStation)
  station!: ChargingStation;

  @BelongsTo(() => Evse)
  declare evse?: EVSEType;

  @ForeignKey(() => Evse)
  @Column(DataType.INTEGER)
  declare evseDatabaseId?: number;

  @Column({
    unique: 'stationId_transactionId',
  })
  declare transactionId: string;

  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @HasMany(() => TransactionEvent, { as: Transaction.TRANSACTION_EVENTS_ALIAS, foreignKey: 'transactionDatabaseId' })
  declare transactionEvents?: TransactionEventRequest[];

  // required only for filtering, should not be used to pull transaction events
  @HasMany(() => TransactionEvent, { as: Transaction.TRANSACTION_EVENTS_FILTER_ALIAS, foreignKey: 'transactionDatabaseId' })
  declare transactionEventsFilter?: TransactionEventRequest[];

  @HasMany(() => MeterValue)
  declare meterValues?: MeterValueType[];

  @Column(DataType.STRING)
  declare chargingState?: ChargingStateEnumType | null;

  @Column(DataType.BIGINT)
  declare timeSpentCharging?: number | null;

  @Column(DataType.DECIMAL)
  declare totalKwh?: number | null;

  @Column(DataType.STRING)
  declare stoppedReason?: ReasonEnumType | null;

  @Column(DataType.INTEGER)
  declare remoteStartId?: number | null;

  declare customData?: CustomDataType | null;

  static buildTransaction(
    id: string, // todo temp
    stationId: string,
    transactionId: string,
    isActive: boolean,
    transactionEvents: TransactionEventRequest[],
    meterValues: MeterValueType[],
    chargingState?: ChargingStateEnumType,
    timeSpentCharging?: number,
    totalKwh?: number,
    stoppedReason?: ReasonEnumType,
    remoteStartId?: number,
    customData?: CustomDataType,
  ) {
    const transaction = new Transaction();
    transaction.id = id;
    transaction.stationId = stationId;
    transaction.transactionId = transactionId;
    transaction.isActive = isActive;
    transaction.transactionEvents = transactionEvents;
    transaction.meterValues = meterValues;
    transaction.chargingState = chargingState;
    transaction.timeSpentCharging = timeSpentCharging;
    transaction.totalKwh = totalKwh;
    transaction.stoppedReason = stoppedReason;
    transaction.remoteStartId = remoteStartId;
    transaction.customData = customData;
    return transaction;
  }
}
