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

import { AttributeEnumType, ComponentType, CustomDataType, EVSEType, MutabilityEnumType, Namespace, StatusInfoType, VariableAttributeType, VariableType } from "@citrineos/base";
import { BeforeCreate, BelongsTo, Column, DataType, ForeignKey, Index, Model, Table } from "sequelize-typescript";
import * as bcrypt from "bcrypt";
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

    /**
     * Hook to ensure passwordString is not saved plaintext.
     * This particular component/variable combination is the only one defined in OCPP 2.0.1 Part 2 - Appendices to use the type passwordString
     * N.B. DataEnumType, used in VariableCharacteristics, does not have 'passwordString'! It is missing other types as well. It is unclear if this is an oversight in the protocol.
     * If in a future version of the protocol 'passwordString' is added to DataEnumType, this hook will need to be adjusted
     */
    @BeforeCreate
    static async beforeCreateHook(instance: VariableAttribute) {
        // Fetch related Component and Variable
        const component = await Component.findByPk(instance.componentId);
        const variable = await Variable.findByPk(instance.variableId);

        // Check if the conditions are met
        if (component?.name === 'SecurityCtrlr' && variable?.name === 'BasicAuthPassword' && instance.value) {
            // hash passwordString
            const passwordString = instance.value;
            const salt = await bcrypt.genSalt(10);
            instance.value = await bcrypt.hash(passwordString, salt);
        }
    }

    /**
     * Utility method to compare password.
     * If in a future version of the protocol 'passwordString' is added to DataEnumType, this function will need to be adjusted
     * @param password Plaintext password to be compared
     * @returns 
     */
    public async validatePassword(password: string): Promise<boolean> {
        if (!this.value) {
            return false;
        }
        return bcrypt.compare(password, this.value);
    }
}