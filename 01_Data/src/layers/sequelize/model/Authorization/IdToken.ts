// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { BelongsToMany, Column, DataType, HasOne, Model, Table } from 'sequelize-typescript';
import { AdditionalInfo } from './AdditionalInfo';
import { IdTokenAdditionalInfo } from './IdTokenAdditionalInfo';
import { Authorization } from './Authorization';

@Table({
  indexes: [
    {
      unique: true,
      fields: ['idToken'],
      where: {
        type: null,
      },
    },
  ],
})
export class IdToken extends Model {
  static readonly MODEL_NAME: string = Namespace.IdToken;

  @BelongsToMany(() => AdditionalInfo, () => IdTokenAdditionalInfo)
  declare additionalInfo?: [AdditionalInfo, ...AdditionalInfo[]] | null;

  @Column({
    type: DataType.STRING,
    unique: 'idToken_type',
  })
  declare idToken: string;

  @Column({
    type: DataType.STRING,
    unique: 'idToken_type',
  })
  declare type?: string | null;

  @HasOne(() => Authorization)
  declare authorization: Authorization;

  declare customData?: object | null;
}
