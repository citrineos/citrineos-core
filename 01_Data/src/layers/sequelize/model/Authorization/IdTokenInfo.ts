// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

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