// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type AdditionalInfoType, type CustomDataType, IdTokenType, Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { IdToken } from './IdToken';

@Table
export class AdditionalInfo extends Model implements AdditionalInfoType {
  static readonly MODEL_NAME: string = Namespace.AdditionalInfoType;

  @ForeignKey(() => IdToken)
  @Column(DataType.INTEGER)
  declare idTokenId?: number;

  @BelongsTo(() => IdToken)
  declare idToken: IdTokenType;

  @Column({
    type: DataType.STRING,
    unique: 'additionalIdToken_type',
  })
  declare additionalIdToken: string;

  @Column({
    type: DataType.STRING,
    unique: 'additionalIdToken_type',
  })
  declare type: string;

  declare customData?: CustomDataType;
}
