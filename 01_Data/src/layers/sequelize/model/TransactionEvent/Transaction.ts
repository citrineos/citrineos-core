// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace, OCPP2_0_1 } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { MeterValue } from './MeterValue';
import { TransactionEvent } from './TransactionEvent';
import { Evse } from '../DeviceModel';
import { ChargingStation } from '../Location';

@Table
export class Transaction extends Model implements OCPP2_0_1.TransactionType {
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
  declare evse?: OCPP2_0_1.EVSEType;

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
  declare transactionEvents?: OCPP2_0_1.TransactionEventRequest[];

  // required only for filtering, should not be used to pull transaction events
  @HasMany(() => TransactionEvent, { as: Transaction.TRANSACTION_EVENTS_FILTER_ALIAS, foreignKey: 'transactionDatabaseId' })
  declare transactionEventsFilter?: OCPP2_0_1.TransactionEventRequest[];

  @HasMany(() => MeterValue)
  declare meterValues?: OCPP2_0_1.MeterValueType[];

  @Column(DataType.STRING)
  declare chargingState?: OCPP2_0_1.ChargingStateEnumType | null;

  @Column(DataType.BIGINT)
  declare timeSpentCharging?: number | null;

  @Column(DataType.DECIMAL)
  declare totalKwh?: number | null;

  @Column(DataType.STRING)
  declare stoppedReason?: OCPP2_0_1.ReasonEnumType | null;

  @Column(DataType.INTEGER)
  declare remoteStartId?: number | null;

  @Column(DataType.DECIMAL)
  declare totalCost?: number;
  
  declare customData?: OCPP2_0_1.CustomDataType | null;

  static buildTransaction(
    id: string, // todo temp
    stationId: string,
    transactionId: string,
    isActive: boolean,
    transactionEvents: OCPP2_0_1.TransactionEventRequest[],
    meterValues: OCPP2_0_1.MeterValueType[],
    chargingState?: OCPP2_0_1.ChargingStateEnumType,
    timeSpentCharging?: number,
    totalKwh?: number,
    stoppedReason?: OCPP2_0_1.ReasonEnumType,
    remoteStartId?: number,
    totalCost?: number,
    customData?: OCPP2_0_1.CustomDataType,
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
