// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type AuthorizationData, type CustomDataType, IdTokenInfoType, IdTokenType, Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { IdToken } from './IdToken';
import { IdTokenInfo } from './IdTokenInfo';
import { type AuthorizationRestrictions } from '../../../../interfaces';

@Table
export class Authorization extends Model implements AuthorizationData, AuthorizationRestrictions {
  static readonly MODEL_NAME: string = Namespace.AuthorizationData;

  @Column(DataType.ARRAY(DataType.STRING))
  declare allowedConnectorTypes?: string[];

  @Column(DataType.ARRAY(DataType.STRING))
  declare disallowedEvseIdPrefixes?: string[];

  @ForeignKey(() => IdToken)
  @Column({
    type: DataType.INTEGER,
    unique: true,
  })
  declare idTokenId?: number;

  @BelongsTo(() => IdToken)
  declare idToken: IdTokenType;

  @ForeignKey(() => IdTokenInfo)
  @Column(DataType.INTEGER)
  declare idTokenInfoId?: number;

  @BelongsTo(() => IdTokenInfo)
  declare idTokenInfo?: IdTokenInfoType;

  declare customData?: CustomDataType;
}
