// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ChargingStationDto,
  OCPPVersionType,
  ServerNetworkProfileDto,
  TenantDto,
  WebsocketServerConfig,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, OCPP2_Namespace } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Tenant } from '../tenant.js';
import { ChargingStation } from './charging-station.js';
import { ChargingStationNetworkProfile } from './charging-station-network-profile.js';

@Table
export class ServerNetworkProfile
  extends Model
  implements WebsocketServerConfig, ServerNetworkProfileDto
{
  static readonly MODEL_NAME: string = OCPP2_Namespace.ServerNetworkProfile;

  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare host: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare port: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare pingInterval: number;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
  })
  declare protocols: OCPPVersionType[];

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare messageTimeout: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare securityProfile: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare allowUnknownChargingStations: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare dynamicTenantResolution: boolean;

  @Column(DataType.STRING)
  declare tlsKeyFilePath?: string;

  @Column(DataType.STRING)
  declare tlsCertificateChainFilePath?: string;

  @Column(DataType.STRING)
  declare mtlsCertificateAuthorityKeyFilePath?: string;

  @Column(DataType.STRING)
  declare rootCACertificateFilePath?: string;

  @BelongsToMany(() => ChargingStation, () => ChargingStationNetworkProfile)
  declare chargingStations?: ChargingStationDto[] | null;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId?: number;

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: ServerNetworkProfile) {
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
