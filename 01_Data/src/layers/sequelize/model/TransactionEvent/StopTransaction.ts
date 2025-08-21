// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  DEFAULT_TENANT_ID,
  IStopTransactionDto,
  ITenantDto,
  OCPP1_6_Namespace,
} from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Transaction } from './Transaction.js';
import { MeterValue } from './MeterValue.js';
import { Tenant } from '../Tenant.js';

@Table
export class StopTransaction extends Model implements IStopTransactionDto {
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

  @Column(DataType.STRING)
  declare reason?: string;

  @HasMany(() => MeterValue)
  declare meterValues?: MeterValue[];

  // Add flat idToken fields
  @Column(DataType.STRING)
  declare idTokenValue?: string;

  @Column(DataType.STRING)
  declare idTokenType?: string;

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
  static setDefaultTenant(instance: StopTransaction) {
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
