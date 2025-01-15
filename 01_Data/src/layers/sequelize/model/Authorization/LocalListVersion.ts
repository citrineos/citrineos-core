// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1_Namespace, OCPP2_0_1 } from '@citrineos/base';
import { BelongsToMany, Column, DataType, Model, Table } from 'sequelize-typescript';
import { LocalListAuthorization } from '.';
import { LocalListVersionAuthorization } from './LocalListVersionAuthorization';

@Table
export class LocalListVersion extends Model {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.LocalListVersion;

  @Column({
    unique: true,
  })
  declare stationId: string;

  @Column(DataType.INTEGER)
  declare versionNumber: number;

  @BelongsToMany(() => LocalListAuthorization, () => LocalListVersionAuthorization)
  declare localAuthorizationList?: [LocalListAuthorization, ...LocalListAuthorization[]] | undefined;

  customData?: OCPP2_0_1.CustomDataType | null | undefined;
}
