// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  ConnectorErrorCode,
  ConnectorFormatEnum,
  ConnectorPowerType,
  ConnectorStatus,
  ConnectorTypeEnum,
  IConnectorDto,
  OCPP1_6_Namespace,
} from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { BaseModelWithTenant } from '../BaseModelWithTenant';
import { Evse } from './Evse';
import { Tariff } from '../Tariff';

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
    type: DataType.INTEGER,
  })
  declare evseId: number;

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

  @Column(DataType.STRING)
  declare type?: ConnectorTypeEnum | null;

  @Column(DataType.STRING)
  declare format?: ConnectorFormatEnum | null;

  @Column({
    type: DataType.STRING,
    defaultValue: ConnectorErrorCode.NoError,
  })
  declare errorCode: ConnectorErrorCode;

  @Column(DataType.STRING)
  declare powerType?: ConnectorPowerType | null;

  @Column(DataType.INTEGER)
  declare maximumAmperage?: number | null;

  @Column(DataType.INTEGER)
  declare maximumVoltage?: number | null;

  @Column(DataType.INTEGER)
  declare maximumPowerWatts?: number | null;

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

  @Column(DataType.STRING)
  declare termsAndConditionsUrl?: string | null;

  @BelongsTo(() => ChargingStation)
  declare chargingStation?: ChargingStation;

  @BelongsTo(() => Evse)
  declare evse?: Evse;

  @HasMany(() => Tariff)
  declare tariffs?: Tariff[];
}
