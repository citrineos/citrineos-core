// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ComponentType, CustomDataType, EVSEType, Namespace, VariableType } from "@citrineos/base";
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import { Evse } from "./Evse";
import { Variable } from "./Variable";

@Table
export class Component extends Model implements ComponentType {

    static readonly MODEL_NAME: string = Namespace.ComponentType;

    declare customData?: CustomDataType | undefined;

    /**
     * Fields
     */

    @Column({
        type: DataType.STRING,
        unique: 'evse_name_instance'
    })
    declare name: string;
    
    @Column({
        type: DataType.STRING,
        unique: 'evse_name_instance'
    })
    declare instance?: string;

    /**
     * Relations
     */
    
    @BelongsTo(() => Evse)
    declare evse?: EVSEType;

    @ForeignKey(() => Evse)
    @Column({
        type: DataType.INTEGER,
        unique: 'evse_name_instance'
    })
    declare evseDatabaseId?: number;

    @HasMany(() => Variable)
    declare variables?: VariableType[];
}