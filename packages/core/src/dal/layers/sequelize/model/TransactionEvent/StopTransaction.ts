// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  MeterValueDto,
  StopTransactionDto,
  TenantDto,
  TransactionDto,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, OCPP1_6_Namespace } from '@citrineos/base';
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

import { Tenant } from '../Tenant.js';
import { MeterValue } from './MeterValue.js';
import { Transaction } from './Transaction.js';

@Table
export class StopTransaction extends Model implements StopTransactionDto {
  static readonly MODEL_NAME: string = OCPP1_6_Namespace.StopTransaction;

  @Column(DataType.STRING)
  declare ocppConnectionName: string;

  // No @ForeignKey annotation: the database constraint is composite
  // (transactionDatabaseId, transactionCreatedAt) -> Transactions(id, "createdAt"),
  @Column({
    type: DataType.INTEGER,
    unique: 'transactionDatabaseId_transactionCreatedAt',
  })
  declare transactionDatabaseId: number;

  // Partition key
  @Column({
    type: DataType.DATE,
    unique: 'transactionDatabaseId_transactionCreatedAt',
  })
  declare transactionCreatedAt?: Date;

  @BelongsTo(() => Transaction, 'transactionDatabaseId')
  declare transaction: TransactionDto;

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

  @HasMany(() => MeterValue, 'stopTransactionDatabaseId')
  declare meterValues?: MeterValueDto[];

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

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

  @BeforeCreate
  static async resolveTransactionCreatedAt(instance: StopTransaction): Promise<void> {
    if (instance.transactionCreatedAt == null) {
      instance.transactionCreatedAt = await Transaction.resolveCreatedAt(
        instance.transactionDatabaseId,
      );
    }
  }

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
