// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript';
import { IdToken } from '../Authorization';
import { Evse } from '../DeviceModel';
import { MeterValue } from './MeterValue';
import { Transaction } from './Transaction';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class TransactionEvent extends BaseModelWithTenant {
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
  declare transactionDatabaseId?: string;

  @BelongsTo(() => Transaction)
  declare transaction?: Transaction;

  @Column(DataType.JSON)
  declare transactionInfo: OCPP2_0_1.TransactionType;

  @ForeignKey(() => Evse)
  declare evseId?: number | null;

  @BelongsTo(() => Evse)
  declare evse?: OCPP2_0_1.EVSEType;

  @ForeignKey(() => IdToken)
  declare idTokenId?: number | null;

  @BelongsTo(() => IdToken)
  declare idToken?: IdToken;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
