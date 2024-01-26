// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ComponentType, CustomDataType, Namespace, VariableCharacteristicsType, VariableType } from "@citrineos/base";
import { BelongsTo, Column, DataType, ForeignKey, HasMany, HasOne, Model, Table } from "sequelize-typescript";
import { Component } from "./Component";
import { VariableAttribute } from "./VariableAttribute";
import { VariableCharacteristics } from "./VariableCharacteristics";

@Table
export class Variable extends Model implements VariableType {

    static readonly MODEL_NAME: string = Namespace.VariableType;

    declare customData?: CustomDataType;

   /**
     * Fields
     */

    @Column({
        type: DataType.STRING,
        unique: 'name_instance'
    })
    declare name: string;
    
    @Column({
        type: DataType.STRING,
        unique: 'name_instance'
    })
    declare instance?: string;

    /**
     * Relations
     */
    
    @BelongsTo(() => Component)
    declare component: ComponentType;

    @ForeignKey(() => Component)
    @Column(DataType.INTEGER)
    declare componentId?: number;

    @HasMany(() => VariableAttribute)
    declare variableAttributes?: VariableAttribute[];

    @HasOne(() => VariableCharacteristics)
    declare variableCharacteristics: VariableCharacteristicsType;
}