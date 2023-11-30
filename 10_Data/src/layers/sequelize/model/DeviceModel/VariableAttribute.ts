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

import { AttributeEnumType, ComponentType, CustomDataType, DataEnumType, EVSEType, MutabilityEnumType, Namespace, StatusInfoType, VariableAttributeType, VariableType } from "@citrineos/base";
import { BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, ForeignKey, HasMany, HasOne, Index, Model, Table } from "sequelize-typescript";
import * as bcrypt from "bcrypt";
import { Variable } from "./Variable";
import { Component } from "./Component";
import { Evse } from "./Evse";
import { Boot } from "../Boot";
import { VariableStatus } from "./VariableStatus";
import { VariableCharacteristics } from "./VariableCharacteristics";

@Table
export class VariableAttribute extends Model implements VariableAttributeType {

    static readonly MODEL_NAME: string = Namespace.VariableAttributeType;

    declare customData?: CustomDataType;

    /**
     * Fields
     */

    @Index
    @Column({
        unique: 'stationId_type_variableId_componentId_evseDatabaseId'
    })
    declare stationId: string;

    @Column({
        type: DataType.STRING,
        defaultValue: AttributeEnumType.Actual,
        unique: 'stationId_type_variableId_componentId_evseDatabaseId'
    })
    declare type?: AttributeEnumType;
    // From VariableCharacteristics, which belongs to Variable associated with this VariableAttribute
    @Column({
        type: DataType.STRING,
        defaultValue: DataEnumType.string
    })
    declare dataType: DataEnumType;

    @Column({
        type: DataType.STRING,
        set(valueString) {
            if (valueString) {
                const valueType = (this as VariableAttribute).dataType;
                switch (valueType) {
                    case DataEnumType.passwordString:
                        valueString = bcrypt.hashSync(valueString as string, 10);
                        break;
                    default:
                        // Do nothing
                        break;
                }
            }
            this.setDataValue('value', valueString);
        }
    })
    declare value?: string;

    @Column({
        type: DataType.STRING,
        defaultValue: MutabilityEnumType.ReadWrite
    })
    declare mutability?: MutabilityEnumType;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false
    })
    declare persistent?: boolean;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false
    })
    declare constant?: boolean;

    /**
     * Relations
     */

    @BelongsTo(() => Variable)
    declare variable: VariableType;

    @ForeignKey(() => Variable)
    @Column({
        type: DataType.INTEGER,
        unique: 'stationId_type_variableId_componentId_evseDatabaseId'
    })
    declare variableId?: number;

    @BelongsTo(() => Component)
    declare component: ComponentType;

    @ForeignKey(() => Component)
    @Column({
        type: DataType.INTEGER,
        unique: 'stationId_type_variableId_componentId_evseDatabaseId'
    })
    declare componentId?: number;

    @BelongsTo(() => Evse)
    declare evse?: EVSEType;

    @ForeignKey(() => Evse)
    @Column({
        type: DataType.INTEGER,
        unique: 'stationId_type_variableId_componentId_evseDatabaseId'
    })
    declare evseDatabaseId?: number;

    // History of variable status. Can be directly from GetVariablesResponse or SetVariablesResponse, or from NotifyReport handling, or from 'setOnCharger' option for data api 

    @HasMany(() => VariableStatus)
    declare statuses?: VariableStatus[];

    // Below used to associate attributes with boot process

    @BelongsTo(() => Boot)
    declare bootConfig?: Boot;

    @ForeignKey(() => Boot)
    declare bootConfigId?: string;
}