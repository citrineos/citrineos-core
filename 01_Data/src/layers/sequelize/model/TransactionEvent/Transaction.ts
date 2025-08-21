// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  DEFAULT_TENANT_ID,
  IStartTransactionDto,
  IStopTransactionDto,
  ITenantDto,
  ITransactionDto,
  Namespace,
} from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { MeterValue } from './MeterValue.js';
import { TransactionEvent } from './TransactionEvent.js';
import { ChargingStation, Connector, Evse, Location } from '../Location/index.js';
import { StartTransaction, StopTransaction } from './index.js';
import { Authorization } from '../Authorization/index.js';
import { Tariff, Tenant } from '../index.js';

@Table
export class Transaction extends Model implements ITransactionDto {
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

  @Column(DataType.INTEGER)
  @ForeignKey(() => Tariff)
  tariffId?: number;

  @BelongsTo(() => Tariff)
  tariff?: Tariff;

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
  declare startTransaction?: IStartTransactionDto;

  @HasOne(() => StopTransaction)
  declare stopTransaction?: IStopTransactionDto;

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

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: ITenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: Transaction) {
    if (instance.tenantId == null) {
      instance.tenantId = DEFAULT_TENANT_ID;
    }
  }

  constructor(...args: any[]) {
    super(...args);
    if (this.tenantId == null) {
      this.tenantId = DEFAULT_TENANT_ID;
    }
  }
}
