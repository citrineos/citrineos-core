// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type CustomDataType, IdTokenEnumType, type IdTokenType, Namespace } from '@citrineos/base';
import { BelongsToMany, Column, DataType, HasOne, Model, Table } from 'sequelize-typescript';
import { AdditionalInfo } from './AdditionalInfo';
import { IdTokenAdditionalInfo } from './IdTokenAdditionalInfo';
import { Authorization } from './Authorization';

@Table
export class IdToken extends Model implements IdTokenType {
  static readonly MODEL_NAME: string = Namespace.IdTokenType;

  @BelongsToMany(() => AdditionalInfo, () => IdTokenAdditionalInfo)
  declare additionalInfo?: [AdditionalInfo, ...AdditionalInfo[]];

  @Column({
    type: DataType.STRING,
    unique: 'idToken_type',
  })
  declare idToken: string;

  @Column({
    type: DataType.STRING,
    unique: 'idToken_type',
  })
  declare type: IdTokenEnumType;

  @HasOne(() => Authorization)
  declare authorization: Authorization;

  declare customData?: CustomDataType | null;
}
