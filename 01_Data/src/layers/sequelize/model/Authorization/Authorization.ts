// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, Default, ForeignKey, Table } from 'sequelize-typescript';
import { type AuthorizationRestrictions } from '../../../../interfaces';
import { IdToken, IdTokenInfo } from '.';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class Authorization extends BaseModelWithTenant implements AuthorizationRestrictions {
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
  declare idToken: IdToken;

  @ForeignKey(() => IdTokenInfo)
  @Column(DataType.INTEGER)
  declare idTokenInfoId?: number | null;

  @BelongsTo(() => IdTokenInfo)
  declare idTokenInfo?: IdTokenInfo;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare concurrentTransaction?: boolean;

  declare customData?: any | null;
}
