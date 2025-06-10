// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class StatusNotification extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = Namespace.StatusNotificationRequest;

  @ForeignKey(() => ChargingStation)
  declare stationId: string;

  @BelongsTo(() => ChargingStation)
  declare chargingStation: ChargingStation;

  @Column({
    type: DataType.DATE,
    get() {
      const timestamp = this.getDataValue('timestamp');
      return timestamp ? timestamp.toISOString() : null;
    },
  })
  declare timestamp?: string | null;

  @Column(DataType.STRING)
  declare connectorStatus: string;

  @Column(DataType.INTEGER)
  declare evseId?: number | null;

  @Column(DataType.INTEGER)
  declare connectorId: number;

  @Column(DataType.STRING)
  declare errorCode?: string | null;

  @Column(DataType.STRING)
  declare info?: string | null;

  @Column(DataType.STRING)
  declare vendorId?: string | null;

  @Column(DataType.STRING)
  declare vendorErrorCode?: string | null;

  declare customData?: object | null;
}
