// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ITransactionDto, Namespace } from '@citrineos/base';
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
import { Evse, ChargingStation, Location, Connector } from '../Location';
import { StartTransaction, StopTransaction } from './';
import { BaseModelWithTenant } from '../BaseModelWithTenant';
import { Authorization } from '../Authorization';

@Table
export class Transaction extends BaseModelWithTenant implements ITransactionDto {
  static readonly MODEL_NAME: string = Namespace.TransactionType;
  static readonly TRANSACTION_EVENTS_ALIAS = 'transactionEvents';
  static readonly TRANSACTION_EVENTS_FILTER_ALIAS = 'transactionEventsFilter';

  @Column(DataType.INTEGER)
  @ForeignKey(() => Location)
  locationId?: number;

  @BelongsTo(() => Location)
  location?: Location;

  @Column({
    unique: 'stationId_transactionId',
  })
  @ForeignKey(() => ChargingStation)
  stationId!: string;

  @BelongsTo(() => ChargingStation)
  station!: ChargingStation;

  @ForeignKey(() => Evse)
  @Column(DataType.INTEGER)
  declare evseId?: number;

  @BelongsTo(() => Evse)
  declare evse?: Evse | null;

  @Column(DataType.INTEGER)
  @ForeignKey(() => Connector)
  declare connectorId?: number;

  @BelongsTo(() => Connector)
  declare connector?: Connector | null;

  @Column(DataType.INTEGER)
  @ForeignKey(() => Authorization)
  authorizationId?: number;

  @BelongsTo(() => Authorization)
  authorization?: Authorization;

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

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('startTime')?.toISOString();
    },
  })
  declare startTime?: string;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('endTime')?.toISOString();
    },
  })
  declare endTime?: string;

  @Column(DataType.JSONB)
  declare customData?: any | null;
}
