// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { TenantDto, TransactionEventDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
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
import { EvseType } from '../DeviceModel/index.js';
import { MeterValue } from './MeterValue.js';
import { Transaction } from './Transaction.js';
import { Tenant } from '../Tenant.js';

@Table
export class TransactionEvent extends Model implements TransactionEventDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.TransactionEventRequest;

  @Column(DataType.STRING)
  declare stationId: string;

  @Column(DataType.STRING)
  declare eventType: OCPP2_0_1.TransactionEventEnumType;

  @HasMany(() => MeterValue)
  declare meterValue?: [MeterValue, ...MeterValue[]];

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp')?.toISOString();
    },
  })
  declare timestamp: string;

  @Column(DataType.STRING)
  declare triggerReason: OCPP2_0_1.TriggerReasonEnumType;

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

  @ForeignKey(() => Transaction)
  declare transactionDatabaseId?: number;

  @BelongsTo(() => Transaction)
  declare transaction?: Transaction;

  @Column(DataType.JSON)
  declare transactionInfo: OCPP2_0_1.TransactionType;

  @ForeignKey(() => EvseType)
  declare evseId?: number | null;

  @BelongsTo(() => EvseType)
  declare evse?: OCPP2_0_1.EVSEType;

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

  @BelongsTo(() => Tenant)
  declare tenant?: TenantDto;

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
