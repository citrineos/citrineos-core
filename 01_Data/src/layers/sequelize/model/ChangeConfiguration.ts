// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6_Namespace } from '@citrineos/base';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class ChangeConfiguration extends Model {
  static readonly MODEL_NAME: string = OCPP1_6_Namespace.ChangeConfiguration;

  @Column({
    unique: 'stationId_key',
    allowNull: false,
    type: DataType.STRING,
  })
  declare stationId: string;

  @Column({
    unique: 'stationId_key',
    allowNull: false,
    type: DataType.STRING(50),
  })
  declare key: string;

  @Column(DataType.STRING(500))
  declare value?: string | null;

  @Column(DataType.BOOLEAN)
  declare readonly?: boolean | null;
}
