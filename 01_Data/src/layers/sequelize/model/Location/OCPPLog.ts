// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { MessageOrigin } from '@citrineos/base';

@Table
export class OCPPLog extends Model {
  static readonly MODEL_NAME: string = 'OCPPLog';

  @ForeignKey(() => ChargingStation)
  declare stationId: string;

  @Column(DataType.STRING)
  declare origin: MessageOrigin;

  @Column(DataType.TEXT)
  declare log: string;
}
