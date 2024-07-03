// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type CustomDataType, Namespace, StatusNotificationRequest, ConnectorStatusEnumType } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';

@Table
export class StatusNotification extends Model implements StatusNotificationRequest {
  static readonly MODEL_NAME: string = Namespace.StatusNotificationRequest;

  @ForeignKey(() => ChargingStation)
  declare stationId: string;

  @BelongsTo(() => ChargingStation)
  declare chargingStation: ChargingStation;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  @Column
  declare connectorStatus: ConnectorStatusEnumType;

  @Column(DataType.INTEGER)
  declare evseId: number;

  @Column(DataType.INTEGER)
  declare connectorId: number;

  declare customData?: CustomDataType;
}
