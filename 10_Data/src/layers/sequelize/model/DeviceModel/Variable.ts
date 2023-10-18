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