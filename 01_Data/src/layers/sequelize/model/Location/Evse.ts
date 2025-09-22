// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IChargingStationDto, IEvseDto, ITenantDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation.js';
import { Connector } from './Connector.js';
import { Tenant } from '../Tenant.js';

@Table
export class Evse extends Model implements IEvseDto {
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
  declare chargingStation?: IChargingStationDto;

  @HasMany(() => Connector)
  declare connectors?: Connector[] | null;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: ITenantDto;

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
