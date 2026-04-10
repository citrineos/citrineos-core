// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ChargingStationDto, ConnectorDto, EvseDto, TenantDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import { BeforeCreate, BeforeUpdate, Column, DataType, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation.js';

@Table
export class Evse extends Model implements EvseDto {
  static readonly MODEL_NAME: string = Namespace.Evse;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationPkId_evseTypeId',
  })
  declare stationPkId?: number;

  @Column({
    type: DataType.STRING,
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationPkId_evseTypeId',
  })
  declare evseTypeId?: number; // This is the serial int used in OCPP 2.0.1 to refer to the EVSE.

  @Column(DataType.STRING)
  declare evseId: string; // This is the eMI3 compliant EVSE ID

  @Column(DataType.STRING)
  declare physicalReference?: string | null; // Any identifier printed directly on the EVSE

  @Column(DataType.BOOLEAN)
  declare removed?: boolean;

  declare chargingStation?: ChargingStationDto;

  declare connectors?: ConnectorDto[] | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  declare tenant?: TenantDto;

  @BeforeCreate
  static async resolveStationPkId(instance: Evse): Promise<void> {
    if (instance.stationPkId == null && instance.stationId && instance.tenantId != null) {
      const station = await ChargingStation.findOne({
        where: { id: instance.stationId, tenantId: instance.tenantId },
        attributes: ['pkId'],
      });
      if (station) {
        instance.stationPkId = station.pkId;
      }
    }
  }

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: Evse) {
    if (instance.tenantId == null) {
      instance.tenantId = DEFAULT_TENANT_ID;
    }
  }

  constructor(...args: any[]) {
    super(...args);
    if (this.tenantId == null) {
      this.tenantId = DEFAULT_TENANT_ID;
    }
  }
}
