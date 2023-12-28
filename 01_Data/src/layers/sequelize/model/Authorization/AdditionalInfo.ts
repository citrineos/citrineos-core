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

import { AdditionalInfoType, Namespace, CustomDataType, IdTokenType } from "@citrineos/base";
import { Table, ForeignKey, Column, DataType, Model, BelongsTo } from "sequelize-typescript";
import { IdToken } from "./IdToken";

@Table
export class AdditionalInfo extends Model implements AdditionalInfoType {

    static readonly MODEL_NAME: string = Namespace.AdditionalInfoType;

    declare customData?: CustomDataType;

    @ForeignKey(() => IdToken)
    @Column(DataType.INTEGER)
    declare idTokenId?: number;

    @BelongsTo(() => IdToken)
    declare idToken: IdTokenType;

    @Column({
        type: DataType.STRING,
        unique: 'additionalIdToken_type'
    })
    declare additionalIdToken: string;

    @Column({
        type: DataType.STRING,
        unique: 'additionalIdToken_type'
    })
    declare type: string;
}