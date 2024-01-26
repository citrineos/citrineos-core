// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

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

    @Column({
        type: DataType.DATE,
        get() {
            return this.getDataValue('timestamp').toISOString();
        }
    })
    declare timestamp: string;
}
