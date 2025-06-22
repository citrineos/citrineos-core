// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class Evse extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = Namespace.Evse;

  @ForeignKey(() => ChargingStation)
  @Column({
    unique: 'stationId_evseId',
    allowNull: false,
    type: DataType.STRING,
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_evseId',
    allowNull: false,
  })
  declare evseId: number;

  @Column(DataType.STRING)
  declare physicalReference?: string;

  @Column(DataType.BOOLEAN)
  declare removed?: boolean;

  @BelongsTo(() => ChargingStation)
  declare chargingStation?: ChargingStation;
}
