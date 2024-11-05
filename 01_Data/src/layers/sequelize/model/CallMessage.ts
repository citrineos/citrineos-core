// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Column, DataType, Index, Model, Table } from 'sequelize-typescript';

/**
 * The CallMessage model can be extended with new optional fields,
 * e.g. chargingProfileId, for other correlationId related lookups.
 */
@Table
export class CallMessage extends Model {
  static readonly MODEL_NAME: string = 'CallMessage';

  @Index
  @Column({
    type: DataType.STRING,
    unique: true,
  })
  declare correlationId: string;

  @Column(DataType.INTEGER)
  declare reservationId?: number;

  @Column(DataType.STRING)
  declare websocketServerConfigId?: string

  @Column(DataType.INTEGER)
  declare configurationSlot?: number
}
