// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6_Namespace } from '@citrineos/base';
import { Column, DataType, HasOne, Model, Table } from 'sequelize-typescript';
import { StatusNotification } from './StatusNotification';

@Table
export class Connector extends Model {
  static readonly MODEL_NAME: string = OCPP1_6_Namespace.Connector;

  @Column({
    unique: 'stationId_connectorId',
    allowNull: false,
    type: DataType.STRING,
  })
  declare stationId: string;

  @Column({
    unique: 'stationId_connectorId',
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare connectorId: number;

  @HasOne(() => StatusNotification)
  declare statusNotification?: StatusNotification;
}
