// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1_Namespace, OCPP2_0_1 } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { type AuthorizationRestrictions } from '../../../../interfaces';
import { IdToken, IdTokenInfo } from '.';

@Table
export class Authorization extends Model implements OCPP2_0_1.AuthorizationData, AuthorizationRestrictions {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.AuthorizationData;

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

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
