// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type MeterValueDto,
  type TenantDto,
  type TransactionDto,
  type TransactionEventDto,
  type TransactionEventEnumType,
  type TransactionType,
  type TriggerReasonEnumType,
  OCPP2_0_1,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, OCPP2_Namespace } from '@citrineos/base';
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

import { EvseType } from '../device-model/evse-type.js';
import { Tenant } from '../tenant.js';
import { MeterValue } from './meter-value.js';
import { Transaction } from './transaction.js';

@Table
export class TransactionEvent extends Model implements TransactionEventDto {
  static readonly MODEL_NAME: string = OCPP2_Namespace.TransactionEventRequest;

  @Column(DataType.STRING)
  declare ocppConnectionName: string;

  @Column(DataType.STRING)
  declare eventType: TransactionEventEnumType;

  @HasMany(() => MeterValue, 'transactionEventId')
  declare meterValue?: [MeterValueDto, ...MeterValueDto[]];

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp')?.toISOString();
    },
  })
  declare timestamp: string;

  @Column(DataType.STRING)
  declare triggerReason: TriggerReasonEnumType;

  @Column(DataType.INTEGER)
  declare seqNo: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare offline?: boolean | null;

  @Column(DataType.INTEGER)
  declare numberOfPhasesUsed?: number | null;

  @Column(DataType.DECIMAL)
  declare cableMaxCurrent?: number | null;

  @Column(DataType.INTEGER)
  declare reservationId?: number | null;

  // No @ForeignKey: the database constraint is composite
  // (transactionDatabaseId, transactionCreatedAt) -> Transactions(id, "createdAt"),
  declare transactionDatabaseId?: number;

  // Partition key
  @Column(DataType.DATE)
  declare transactionCreatedAt?: Date;

  @BelongsTo(() => Transaction, 'transactionDatabaseId')
  declare transaction?: TransactionDto;

  @Column(DataType.JSON)
  declare transactionInfo: TransactionType;

  @ForeignKey(() => EvseType)
  declare evseId?: number | null;

  @BelongsTo(() => EvseType, 'evseId')
  declare evse?: EvseType;

  @Column(DataType.STRING)
  declare idTokenValue?: string | null;

  @Column(DataType.STRING)
  declare idTokenType?: string | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;

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
  static async resolveTransactionCreatedAt(instance: TransactionEvent): Promise<void> {
    if (instance.transactionCreatedAt == null) {
      instance.transactionCreatedAt = await Transaction.resolveCreatedAt(
        instance.transactionDatabaseId,
      );
    }
  }

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: TransactionEvent) {
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
