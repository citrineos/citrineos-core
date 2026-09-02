// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ConnectorDto,
  MeterValueDto,
  SampledValue,
  StopTransactionDto,
  TariffDto,
  TenantDto,
  TransactionDto,
  TransactionEventDto,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
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
import { Connector } from '../location/connector.js';
import { Tariff } from '../tariff/tariffs.js';
import { Tenant } from '../tenant.js';
import { StopTransaction } from './stop-transaction.js';
import { Transaction } from './transaction.js';
import { TransactionEvent } from './transaction-event.js';

@Table
export class MeterValue extends Model implements MeterValueDto {
  static readonly MODEL_NAME: string = Namespace.MeterValue;

  // No @ForeignKey annotation: the database constraint is composite,
  // pairing this column with "transactionCreatedAt".
  // @BelongsTo associations below still work for reads.
  @Column(DataType.INTEGER)
  declare transactionEventId?: number | null;

  @BelongsTo(() => TransactionEvent, 'transactionEventId')
  declare transactionEvent?: TransactionEventDto;

  // Use composite FK, as above.
  @Column(DataType.INTEGER)
  declare transactionDatabaseId?: number | null;

  @BelongsTo(() => Transaction, 'transactionDatabaseId')
  declare transaction?: TransactionDto;

  // Use composite FK, as above.
  @Column(DataType.INTEGER)
  declare stopTransactionDatabaseId?: number | null;

  // Partition key, shared by all three composite foreign keys above.
  @Column(DataType.DATE)
  declare transactionCreatedAt?: Date;

  @BelongsTo(() => StopTransaction, 'stopTransactionDatabaseId')
  declare stopTransaction?: StopTransactionDto;

  @Column(DataType.JSONB)
  declare sampledValue: [SampledValue, ...SampledValue[]];

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  @ForeignKey(() => Connector)
  @Column(DataType.INTEGER)
  declare connectorId?: number;

  @BelongsTo(() => Connector, 'connectorId')
  declare connector?: ConnectorDto;

  declare customData?: any | null;

  @ForeignKey(() => Tariff)
  @Column(DataType.INTEGER)
  declare tariffId?: number | null;

  @BelongsTo(() => Tariff, 'tariffId')
  declare tariff?: TariffDto;

  @Column(DataType.STRING)
  declare transactionId?: string | null;

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
  static async resolvePartitionKey(instance: MeterValue): Promise<void> {
    if (instance.transactionCreatedAt != null) {
      return;
    }
    if (instance.transactionDatabaseId != null) {
      instance.transactionCreatedAt = await Transaction.resolveCreatedAt(
        instance.transactionDatabaseId,
      );
      return;
    }
    // Not linked to a Transaction directly, but a linked sibling carries the same key.
    const sibling =
      instance.stopTransactionDatabaseId != null
        ? await StopTransaction.findOne({
            where: { id: instance.stopTransactionDatabaseId },
            attributes: ['transactionCreatedAt'],
          })
        : instance.transactionEventId != null
          ? await TransactionEvent.findOne({
              where: { id: instance.transactionEventId },
              attributes: ['transactionCreatedAt'],
            })
          : null;
    const key = sibling?.get('transactionCreatedAt') as Date | undefined;
    if (key) {
      instance.transactionCreatedAt = key;
      return;
    }
    instance.transactionCreatedAt = new Date();
  }

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: MeterValue) {
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
