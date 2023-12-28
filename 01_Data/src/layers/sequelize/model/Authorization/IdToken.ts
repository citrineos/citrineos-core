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

import { IdTokenType, Namespace, CustomDataType, AdditionalInfoType, IdTokenEnumType } from "@citrineos/base";
import { Table, PrimaryKey, Column, DataType, Model, HasMany } from "sequelize-typescript";
import { AdditionalInfo } from "./AdditionalInfo";

@Table
export class IdToken extends Model implements IdTokenType {

    static readonly MODEL_NAME: string = Namespace.IdTokenType;

    declare customData?: CustomDataType;

    @HasMany(() => AdditionalInfo)
    declare additionalInfo?: [AdditionalInfoType, ...AdditionalInfoType[]];

    @Column({
        type: DataType.STRING,
        unique: 'idToken_type'
    })
    declare idToken: string;

    @Column({
        type: DataType.STRING,
        unique: 'idToken_type'
    })
    declare type: IdTokenEnumType;
}
