// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';

/**
 * Represents a stored version of the local auth list for a charging station.
 *
 */
@Table
export class LocalAuthListVersion extends Model {
    static readonly MODEL_NAME: string = Namespace.LocalAuthListVersion;

    @Column({
        type: DataType.STRING,
        unique: true
    })
    declare stationId: string;

    @Column({
        type: DataType.INTEGER,
    })
    declare version: number;
}
