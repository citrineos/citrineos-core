// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type CustomDataType, type EVSEType, Namespace } from '@citrineos/base';
import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class Evse extends Model implements EVSEType {
  static readonly MODEL_NAME: string = Namespace.EVSEType;

  /**
   * Fields
   */

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Column({
    type: DataType.INTEGER,
    unique: 'id_connectorId',
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    unique: 'id_connectorId',
  })
  declare connectorId?: number;

  declare customData?: CustomDataType;
}
