// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { MeterValueDto, TenantDto, SampledValue } from '@citrineos/base';
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
import { TransactionEvent } from './TransactionEvent.js';
import { Transaction } from './Transaction.js';
import { StopTransaction } from './StopTransaction.js';
import { Tenant } from '../Tenant.js';
import { Tariff } from '../Tariff/index.js';

@Table
export class MeterValue extends Model implements MeterValueDto {
  static readonly MODEL_NAME: string = Namespace.MeterValue;

  @ForeignKey(() => TransactionEvent)
  @Column(DataType.INTEGER)
  declare transactionEventId?: number | null;

  @ForeignKey(() => Transaction)
  @Column(DataType.INTEGER)
  declare transactionDatabaseId?: number | null;

  @ForeignKey(() => StopTransaction)
  @Column(DataType.INTEGER)
  declare stopTransactionDatabaseId?: number | null;

  @Column(DataType.JSONB)
  declare sampledValue: [SampledValue, ...SampledValue[]];

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  @Column(DataType.INTEGER)
  declare connectorId?: number;

  declare customData?: any | null;

  @ForeignKey(() => Tariff)
  @Column(DataType.INTEGER)
  declare tariffId?: number | null;

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

  @BelongsTo(() => Tenant)
  declare tenant?: TenantDto;

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
