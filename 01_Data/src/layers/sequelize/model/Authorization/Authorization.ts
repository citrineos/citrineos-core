// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CustomDataType, IdTokenType, IdTokenInfoType, AuthorizationData, Namespace, ConnectorEnumType } from '@citrineos/base';
import { Table, Column, Model, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
import { IdToken } from './IdToken';
import { IdTokenInfo } from './IdTokenInfo';
import { AuthorizationRestrictions } from '../../../../interfaces';

@Table
export class Authorization extends Model implements AuthorizationData, AuthorizationRestrictions {

    static readonly MODEL_NAME: string = Namespace.AuthorizationData;

    declare customData?: CustomDataType;

    @Column(DataType.ARRAY(DataType.STRING))
    declare allowedConnectorTypes?: string[];

    @Column(DataType.ARRAY(DataType.STRING))
    declare disallowedEvseIdPrefixes?: string[];

    @ForeignKey(() => IdToken)
    @Column({
        type: DataType.INTEGER,
        unique: true
    })
    declare idTokenId?: number;

    @BelongsTo(() => IdToken)
    declare idToken: IdTokenType;

    @ForeignKey(() => IdTokenInfo)
    @Column(DataType.INTEGER)
    declare idTokenInfoId?: number;

    @BelongsTo(() => IdTokenInfo)
    declare idTokenInfo?: IdTokenInfoType;
}

