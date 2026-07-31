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
import { Connector } from '../Location/Connector.js';
import { Tariff } from '../Tariff/Tariffs.js';
import { Tenant } from '../Tenant.js';
import { StopTransaction } from './StopTransaction.js';
import { Transaction } from './Transaction.js';
import { TransactionEvent } from './TransactionEvent.js';

@Table
export class MeterValue extends Model implements MeterValueDto {
  static readonly MODEL_NAME: string = Namespace.MeterValue;

  @ForeignKey(() => TransactionEvent)
  @Column(DataType.INTEGER)
  declare transactionEventId?: number | null;

  @BelongsTo(() => TransactionEvent, 'transactionEventId')
  declare transactionEvent?: TransactionEventDto;

  @ForeignKey(() => Transaction)
  @Column(DataType.INTEGER)
  declare transactionDatabaseId?: number | null;

  @BelongsTo(() => Transaction, 'transactionDatabaseId')
  declare transaction?: TransactionDto;

  @ForeignKey(() => StopTransaction)
  @Column(DataType.INTEGER)
  declare stopTransactionDatabaseId?: number | null;

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
