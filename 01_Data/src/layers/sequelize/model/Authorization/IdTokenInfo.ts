// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AuthorizationStatusEnumType, type CustomDataType, type IdTokenInfoType, IdTokenType, MessageContentType, Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { IdToken } from './IdToken';

@Table
export class IdTokenInfo extends Model implements IdTokenInfoType {
  static readonly MODEL_NAME: string = Namespace.IdTokenInfoType;

  @Column(DataType.STRING)
  declare status: AuthorizationStatusEnumType;

  @Column(DataType.STRING)
  declare cacheExpiryDateTime?: string | null;

  @Column(DataType.INTEGER)
  declare chargingPriority?: number | null;

  @Column(DataType.STRING)
  declare language1?: string | null;

  @ForeignKey(() => IdToken)
  @Column(DataType.INTEGER)
  declare groupIdTokenId?: number | null;

  @BelongsTo(() => IdToken)
  declare groupIdToken?: IdToken;

  @Column(DataType.STRING)
  declare language2?: string | null;

  @Column(DataType.JSON)
  declare personalMessage?: MessageContentType | null;

  declare customData?: CustomDataType | null;
}
