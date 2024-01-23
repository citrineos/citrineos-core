// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

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