// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Table,
} from 'sequelize-typescript';
import { MeterValue } from './MeterValue';
import { TransactionEvent } from './TransactionEvent';
import { Evse } from '../DeviceModel';
import { ChargingStation } from '../Location';
import { StartTransaction, StopTransaction } from './';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class Transaction extends BaseModelWithTenant {
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
  declare evse?: Evse | null;

  @ForeignKey(() => Evse)
  @Column(DataType.INTEGER)
  declare evseDatabaseId?: number;

  @Column({
    unique: 'stationId_transactionId',
  })
  declare transactionId: string;

  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @HasMany(() => TransactionEvent, {
    as: Transaction.TRANSACTION_EVENTS_ALIAS,
    foreignKey: 'transactionDatabaseId',
  })
  declare transactionEvents?: TransactionEvent[];

  // required only for filtering, should not be used to pull transaction events
  @HasMany(() => TransactionEvent, {
    as: Transaction.TRANSACTION_EVENTS_FILTER_ALIAS,
    foreignKey: 'transactionDatabaseId',
  })
  declare transactionEventsFilter?: TransactionEvent[];

  @HasMany(() => MeterValue)
  declare meterValues?: MeterValue[];

  @HasOne(() => StartTransaction)
  declare startTransaction?: StartTransaction;

  @HasOne(() => StopTransaction)
  declare stopTransaction?: StopTransaction;

  @Column(DataType.STRING)
  declare chargingState?: string | null;

  @Column(DataType.BIGINT)
  declare timeSpentCharging?: number | null;

  @Column(DataType.DECIMAL)
  declare totalKwh?: number | null;

  @Column(DataType.STRING)
  declare stoppedReason?: string | null;

  @Column(DataType.INTEGER)
  declare remoteStartId?: number | null;

  @Column(DataType.DECIMAL)
  declare totalCost?: number;

  declare customData?: any | null;

  static buildTransaction(
    id: string, // todo temp
    stationId: string,
    transactionId: string,
    isActive: boolean,
    transactionEvents: TransactionEvent[],
    meterValues: MeterValue[],
    chargingState?: string,
    timeSpentCharging?: number,
    totalKwh?: number,
    stoppedReason?: string,
    remoteStartId?: number,
    totalCost?: number,
    customData?: object,
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
    transaction.totalCost = totalCost;
    transaction.customData = customData;
    return transaction;
  }
}
