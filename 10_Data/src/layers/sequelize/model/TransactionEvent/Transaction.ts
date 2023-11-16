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

import { ChargingStateEnumType, CustomDataType, EVSEType, MeterValueType, Namespace, ReasonEnumType, TransactionEventRequest, TransactionType } from '@citrineos/base';
import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    HasMany,
    BelongsTo,
  } from 'sequelize-typescript';
import { IdToken } from '../Authorization';
import { MeterValue } from './MeterValue';
import { TransactionEvent } from './TransactionEvent';
import { Evse } from '../DeviceModel';

@Table({ tableName: 'transactions' })
export class Transaction extends Model implements TransactionType {

  static readonly MODEL_NAME: string = Namespace.TransactionType;

  declare customData?: CustomDataType;

  @Column({
    unique: 'stationId_transactionId'
  })
  declare stationId: string;

  @BelongsTo(() => Evse)
  declare evse?: EVSEType;

  @ForeignKey(() => Evse)
  @Column({
      type: DataType.INTEGER,
      unique: 'evse_name_instance'
  })
  declare evseDatabaseId?: number;

  @Column({
    unique: 'stationId_transactionId'
  })
  declare transactionId: string;

  @Column({
    defaultValue: true
  })
  declare isActive: boolean;

  @HasMany(() => TransactionEvent)
  declare transactionEvents?: TransactionEventRequest[];

  @HasMany(() => MeterValue)
  declare meterValues?: MeterValueType[];

  @Column(DataType.STRING)
  declare chargingState?: ChargingStateEnumType;

  @Column(DataType.BIGINT)
  declare timeSpentCharging?: number;

  @Column(DataType.STRING)
  declare stoppedReason?: ReasonEnumType;

  @Column(DataType.INTEGER)
  declare remoteStartId?: number;

  @ForeignKey(() => IdToken)
  declare idTokenId?: number;

  @BelongsTo(() => IdToken)
  declare idToken?: IdToken;
}
