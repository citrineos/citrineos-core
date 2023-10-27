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

import { AttributeEnumType, ComponentType, CustomDataType, EVSEType, MutabilityEnumType, Namespace, SetVariableStatusEnumType, StatusInfoType, VariableAttributeType, VariableType } from "@citrineos/base";
import { BelongsTo, Column, DataType, ForeignKey, Index, Model, Table } from "sequelize-typescript";
import { Variable } from "./Variable";
import { Component } from "./Component";
import { Evse } from "./Evse";
import { Boot } from "../Boot";

@Table
export class VariableAttribute extends Model implements VariableAttributeType {

    static readonly MODEL_NAME: string = Namespace.VariableAttributeType;

    declare customData?: CustomDataType;

    /**
     * Fields
     */
    
    @Index
    @Column({
        unique: 'stationId_type_variableId_componentId_evseSerialId'
    })
    declare stationId: string;
    
    @Column({
        type: DataType.STRING,
        defaultValue: AttributeEnumType.Actual,
        unique: 'stationId_type_variableId_componentId_evseSerialId'
    })
    declare type?: AttributeEnumType;

    @Column(DataType.STRING)
    declare  value?: string;

    @Column({
        type: DataType.STRING,
        defaultValue: MutabilityEnumType.ReadWrite
    })
    declare  mutability?: MutabilityEnumType;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false
    })
    declare  persistent?: boolean;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false
    })
    declare  constant?: boolean;

    // Result fields

    @Column(DataType.STRING)
    declare status?: string;

    @Column(DataType.JSON)
    declare statusInfo?: StatusInfoType;

    /**
     * Relations
     */
    
    @BelongsTo(() => Variable)
    declare variable: VariableType;

    @ForeignKey(() => Variable)
    @Column({
        type: DataType.INTEGER,
        unique: 'stationId_type_variableId_componentId_evseSerialId'
    })
    declare variableId?: number;

    @BelongsTo(() => Component)
    declare component: ComponentType;

    @ForeignKey(() => Component)
    @Column({
        type: DataType.INTEGER,
        unique: 'stationId_type_variableId_componentId_evseSerialId'
    })
    declare componentId?: number;

    @BelongsTo(() => Evse)
    declare evse?: EVSEType;

    @ForeignKey(() => Evse)
    @Column({
        type: DataType.INTEGER,
        unique: 'stationId_type_variableId_componentId_evseSerialId'
    })
    declare evseSerialId?: number;

    // Below used to associate attributes with boot process

    @BelongsTo(() => Boot)
    declare bootConfig?: Boot;

    @ForeignKey(() => Boot)
    declare bootConfigId?: string;
}