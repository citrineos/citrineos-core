// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IEvseDto, Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { BaseModelWithTenant } from '../BaseModelWithTenant';
import { Connector } from './Connector';

@Table
export class Evse extends BaseModelWithTenant implements IEvseDto {
  static readonly MODEL_NAME: string = Namespace.Evse;

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.STRING,
    unique: 'stationId_evseTypeId',
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_evseTypeId',
  })
  declare evseTypeId?: number; // This is the serial int used in OCPP 2.0.1 to refer to the EVSE.

  @Column(DataType.STRING)
  declare evseId: string; // This is the eMI3 compliant EVSE ID

  @Column(DataType.STRING)
  declare physicalReference?: string | null; // Any identifier printed directly on the EVSE

  @Column(DataType.BOOLEAN)
  declare removed?: boolean;

  @BelongsTo(() => ChargingStation)
  declare chargingStation?: ChargingStation;

  @HasMany(() => Connector)
  declare connectors?: Connector[] | null;
}
