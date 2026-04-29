// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ChargingStationDto,
  ChargingStationNetworkProfileDto,
  ServerNetworkProfileDto,
  SetNetworkProfileDto,
  TenantDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation.js';
import { ServerNetworkProfile } from './ServerNetworkProfile.js';
import { SetNetworkProfile } from './SetNetworkProfile.js';
import { Tenant } from '../Tenant.js';

@Table
export class ChargingStationNetworkProfile
  extends Model
  implements ChargingStationNetworkProfileDto
{
  // Namespace enum not used as this is not a model required by CitrineOS
  static readonly MODEL_NAME: string = 'ChargingStationNetworkProfile';

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.STRING,
    unique: 'stationId_configurationSlot',
  })
  declare stationId: string;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation?: ChargingStationDto;

  /**
   * Possible values for a particular station found in device model:
   * OCPPCommCtrlr.NetworkConfigurationPriority.VariableCharacteristics.valuesList
   */
  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_configurationSlot',
  })
  declare configurationSlot: number;

  @ForeignKey(() => SetNetworkProfile)
  @Column(DataType.INTEGER)
  declare setNetworkProfileId: number;

  @BelongsTo(() => SetNetworkProfile, 'setNetworkProfileId')
  declare setNetworkProfile: SetNetworkProfileDto;

  /**
   * If present, the websocket server that correlates to this configuration slot.
   * The ws url in the network profile may not match the configured host, for example in the cloud the
   * configured host will likely be behind a load balancer and a custom DNS name.
   *
   */
  @ForeignKey(() => ServerNetworkProfile)
  @Column(DataType.STRING)
  declare websocketServerConfigId?: string;

  @BelongsTo(() => ServerNetworkProfile, 'websocketServerConfigId')
  declare websocketServerConfig?: ServerNetworkProfileDto;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: ChargingStationNetworkProfile) {
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
