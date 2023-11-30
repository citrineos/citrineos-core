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

import { IdTokenInfoType, Namespace, CustomDataType, AuthorizationStatusEnumType, IdTokenType, MessageContentType } from "@citrineos/base";
import { Table, Column, DataType, ForeignKey, Model, BelongsTo } from "sequelize-typescript";
import { IdToken } from "./IdToken";


@Table
export class IdTokenInfo extends Model implements IdTokenInfoType {

    static readonly MODEL_NAME: string = Namespace.IdTokenInfoType;

    declare customData?: CustomDataType;

    @Column(DataType.STRING)
    declare status: AuthorizationStatusEnumType;

    @Column(DataType.STRING)
    declare cacheExpiryDateTime?: string;

    @Column(DataType.INTEGER)
    declare chargingPriority?: number;

    @Column(DataType.STRING)
    declare language1?: string;

    @ForeignKey(() => IdToken)
    @Column(DataType.INTEGER)
    declare groupIdTokenId?: number;

    @BelongsTo(() => IdToken)
    declare groupIdToken?: IdTokenType;

    @Column(DataType.STRING)
    declare language2?: string;

    @Column(DataType.JSON)
    declare personalMessage?: MessageContentType;
}