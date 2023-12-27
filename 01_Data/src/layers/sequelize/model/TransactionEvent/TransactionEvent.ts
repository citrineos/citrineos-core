/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { CustomDataType, EVSEType, Namespace, TransactionEventEnumType, TransactionEventRequest, TransactionType, TriggerReasonEnumType } from '@citrineos/base';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { IdToken } from '../Authorization';
import { Evse } from '../DeviceModel';
import { MeterValue } from './MeterValue';
import { Transaction } from './Transaction';

@Table
export class TransactionEvent extends Model implements TransactionEventRequest {

  static readonly MODEL_NAME: string = Namespace.TransactionEventRequest;

  declare customData?: CustomDataType;

  @Column
  declare stationId: string;

  @Column(DataType.STRING)
  declare eventType: TransactionEventEnumType;

  @HasMany(() => MeterValue)
  declare meterValue?: [MeterValue, ...MeterValue[]];

  @Column
  declare timestamp: string;

  @Column
  declare triggerReason: TriggerReasonEnumType;

  @Column
  declare seqNo: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare offline?: boolean;

  @Column(DataType.INTEGER)
  declare numberOfPhasesUsed?: number;

  @Column(DataType.DECIMAL)
  declare cableMaxCurrent?: number;

  @Column(DataType.INTEGER)
  declare reservationId?: number;

  @ForeignKey(() => Transaction)
  declare transactionDatabaseId?: string;

  @BelongsTo(() => Transaction)
  declare transaction?: TransactionType;

  @Column(DataType.JSON)
  declare transactionInfo: TransactionType;

  @ForeignKey(() => Evse)
  declare evseId?: number;

  @BelongsTo(() => Evse)
  declare evse?: EVSEType;

  @ForeignKey(() => IdToken)
  declare idTokenId?: number;

  @BelongsTo(() => IdToken)
  declare idToken?: IdToken;
}
