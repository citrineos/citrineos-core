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

import { CustomDataType, MeterValueType, Namespace, SampledValueType } from '@citrineos/base';
import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
} from 'sequelize-typescript';
import { TransactionEvent } from './TransactionEvent';
import { Transaction } from './Transaction';

@Table
export class MeterValue extends Model implements MeterValueType {

    static readonly MODEL_NAME: string = Namespace.MeterValueType;

    declare customData?: CustomDataType;

    @ForeignKey(() => TransactionEvent)
    @Column(DataType.INTEGER)
    declare transactionEventId?: number;

    @ForeignKey(() => Transaction)
    @Column(DataType.INTEGER)
    declare transactionDatabaseId?: number;

    @Column(DataType.JSON)
    declare sampledValue: [SampledValueType, ...SampledValueType[]];

    @Column
    declare timestamp: string;
}
