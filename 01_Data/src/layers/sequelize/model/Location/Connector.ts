// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6, OCPP1_6_Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class Connector extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = OCPP1_6_Namespace.Connector;

  @ForeignKey(() => ChargingStation)
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

  @Column(DataType.ENUM(...Object.values(OCPP1_6.StatusNotificationRequestStatus)))
  declare status: OCPP1_6.StatusNotificationRequestStatus;

  @Column(DataType.ENUM(...Object.values(OCPP1_6.StatusNotificationRequestErrorCode)))
  declare errorCode: OCPP1_6.StatusNotificationRequestErrorCode;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  @Column(DataType.STRING)
  declare info?: string | null;

  @Column(DataType.STRING)
  declare vendorId?: string | null;

  @Column(DataType.STRING)
  declare vendorErrorCode?: string | null;

  @BelongsTo(() => ChargingStation)
  declare chargingStation?: ChargingStation;
}
