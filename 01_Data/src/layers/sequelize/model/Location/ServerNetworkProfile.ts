// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { OCPPVersionType, WebsocketServerConfig, TenantDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1_Namespace } from '@citrineos/base';
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
import { Tenant } from '../Tenant.js';
import { ChargingStation } from './ChargingStation.js';
import { ChargingStationNetworkProfile } from './ChargingStationNetworkProfile.js';

@Table
export class ServerNetworkProfile extends Model implements WebsocketServerConfig {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.ServerNetworkProfile;

  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @Column(DataType.STRING)
  declare host: string;

  @Column(DataType.INTEGER)
  declare port: number;

  @Column(DataType.INTEGER)
  declare pingInterval: number;

  @Column(DataType.STRING)
  declare protocol: OCPPVersionType;

  @Column(DataType.INTEGER)
  declare messageTimeout: number;

  @Column(DataType.INTEGER)
  declare securityProfile: number;

  @Column(DataType.BOOLEAN)
  declare allowUnknownChargingStations: boolean;

  @Column(DataType.STRING)
  declare tlsKeyFilePath?: string;

  @Column(DataType.STRING)
  declare tlsCertificateChainFilePath?: string;

  @Column(DataType.STRING)
  declare mtlsCertificateAuthorityKeyFilePath?: string;

  @Column(DataType.STRING)
  declare rootCACertificateFilePath?: string;

  @BelongsToMany(() => ChargingStation, () => ChargingStationNetworkProfile)
  declare chargingStations?: ChargingStation[] | null;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
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
