// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ITransactionEventDto, OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript';
import { EvseType } from '../DeviceModel';
import { MeterValue } from './MeterValue';
import { Transaction } from './Transaction';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class TransactionEvent extends BaseModelWithTenant implements ITransactionEventDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.TransactionEventRequest;

  @Column
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

  @Column
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
}
