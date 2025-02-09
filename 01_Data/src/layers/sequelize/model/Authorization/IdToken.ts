// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {OCPP2_0_1_Namespace, OCPP2_0_1, Namespace} from '@citrineos/base';
import { BelongsToMany, Column, DataType, HasOne, Model, Table } from 'sequelize-typescript';
import { AdditionalInfo } from './AdditionalInfo';
import { IdTokenAdditionalInfo } from './IdTokenAdditionalInfo';
import { Authorization } from './Authorization';

@Table
export class IdToken extends Model implements OCPP2_0_1.IdTokenType {
  static readonly MODEL_NAME: string = Namespace.IdTokenType;

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
  declare type: OCPP2_0_1.IdTokenEnumType;

  @HasOne(() => Authorization)
  declare authorization: Authorization;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
