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