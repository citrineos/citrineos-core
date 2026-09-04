// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ConnectorDto,
  StartTransactionDto,
  TransactionDto,
  TenantDto,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, OCPP1_6_Namespace } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Transaction } from './transaction.js';
import { Connector } from '../location/index.js';
import { Tenant } from '../tenant.js';

@Table
export class StartTransaction extends Model implements StartTransactionDto {
  static readonly MODEL_NAME: string = OCPP1_6_Namespace.StartTransaction;

  @Column(DataType.STRING)
  declare ocppConnectionName: string;

  @Column(DataType.INTEGER)
  declare meterStart: number; // in Wh

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp')?.toISOString();
    },
  })
  declare timestamp: string;

  @Column(DataType.INTEGER)
  declare reservationId?: number | null;

  @Column({
    type: DataType.INTEGER,
    unique: 'transactionDatabaseId_transactionCreatedAt',
  })
  declare transactionDatabaseId: number;

  @Column({
    type: DataType.DATE,
    unique: 'transactionDatabaseId_transactionCreatedAt',
  })
  declare transactionCreatedAt?: Date;

  @BelongsTo(() => Transaction, 'transactionDatabaseId')
  declare transaction: TransactionDto;

  @ForeignKey(() => Connector)
  declare connectorDatabaseId: number;

  @BelongsTo(() => Connector, 'connectorDatabaseId')
  declare connector: ConnectorDto;

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
  static async resolveTransactionCreatedAt(instance: StartTransaction): Promise<void> {
    if (instance.transactionCreatedAt == null) {
      instance.transactionCreatedAt = await Transaction.resolveCreatedAt(
        instance.transactionDatabaseId,
      );
    }
  }

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: StartTransaction) {
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
