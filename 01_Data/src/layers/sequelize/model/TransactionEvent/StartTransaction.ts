// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { StartTransactionDto, TenantDto } from '@citrineos/base';
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
import { Transaction } from './Transaction.js';
import { Connector } from '../Location/index.js';
import { Tenant } from '../Tenant.js';

@Table
export class StartTransaction extends Model implements StartTransactionDto {
  static readonly MODEL_NAME: string = OCPP1_6_Namespace.StartTransaction;

  @Column(DataType.STRING)
  declare stationId: string;

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

  @ForeignKey(() => Transaction)
  @Column({
    type: DataType.INTEGER,
    unique: true,
  })
  declare transactionDatabaseId: number;

  @BelongsTo(() => Transaction)
  declare transaction: Transaction;

  @ForeignKey(() => Connector)
  declare connectorDatabaseId: number;

  @BelongsTo(() => Connector)
  declare connector: Connector;

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
