// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  ConnectorErrorCode,
  ConnectorStatus,
  IConnectorDto,
  OCPP1_6,
  OCPP1_6_Namespace,
} from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { BaseModelWithTenant } from '../BaseModelWithTenant';
import { Evse } from './Evse';

@Table
export class Connector extends BaseModelWithTenant implements IConnectorDto {
  static readonly MODEL_NAME: string = OCPP1_6_Namespace.Connector;

  @ForeignKey(() => ChargingStation)
  @Column({
    unique: 'stationId_connectorId',
    allowNull: false,
    type: DataType.STRING,
  })
  declare stationId: string;

  @ForeignKey(() => Evse)
  @Column({
    unique: 'evseId_evseTypeConnectorId',
    allowNull: false,
    type: DataType.STRING,
  })
  declare evseId: string;

  @Column({
    unique: 'stationId_connectorId',
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare connectorId: number; // This is the serial int starting at 1 used in OCPP 1.6 to refer to the connector, unique per Charging Station.

  @Column({
    unique: 'evseId_evseTypeConnectorId',
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare evseTypeConnectorId?: number; // This is the serial int starting at 1 used in OCPP 2.0.1 to refer to the connector, unique per EVSE.

  @Column({
    type: DataType.STRING,
    defaultValue: ConnectorStatus.Unknown,
  })
  declare status: ConnectorStatus;

  @Column({
    type: DataType.STRING,
    defaultValue: ConnectorErrorCode.NoError,
  })
  declare errorCode: ConnectorErrorCode;

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

  @BelongsTo(() => Evse)
  declare evse?: Evse;
}
