// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Column, DataType, Index, Model, Table } from 'sequelize-typescript';

@Table
export class CallMessage extends Model {
  static readonly MODEL_NAME: string = "CallMessage";

  @Index
  @Column({
    type: DataType.STRING,
    unique: true,
  })
  declare correlationId: string;

  @Column(DataType.INTEGER)
  declare reservationId?: number;
}
