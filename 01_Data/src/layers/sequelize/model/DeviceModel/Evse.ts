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

import { CustomDataType, EVSEType, Namespace } from "@citrineos/base";
import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table
export class Evse extends Model implements EVSEType {

    static readonly MODEL_NAME: string = Namespace.EVSEType;

    declare customData?: CustomDataType;

    /**
    * Fields
    */

    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare databaseId: number;

    @Column({
        type: DataType.INTEGER,
        unique: 'id_connectorId'
    })
    declare id: number;
    
    @Column({
        type: DataType.INTEGER,
        unique: 'id_connectorId'
    })
    declare connectorId?: number;
}