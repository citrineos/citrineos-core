// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {OCPP2_0_1_Namespace, OCPP2_0_1, Namespace} from '@citrineos/base';
import { BelongsToMany, Column, DataType, Model, Table } from 'sequelize-typescript';
import { IdToken } from './IdToken';
import { IdTokenAdditionalInfo } from './IdTokenAdditionalInfo';

@Table
export class AdditionalInfo extends Model {
  static readonly MODEL_NAME: string = Namespace.AdditionalInfoType;

  @BelongsToMany(() => IdToken, () => IdTokenAdditionalInfo)
  declare additionalInfo?: object[];

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

  declare customData?: any | null;
}
