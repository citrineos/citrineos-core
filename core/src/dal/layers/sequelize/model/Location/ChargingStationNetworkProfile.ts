// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationNetworkProfileDto, TenantDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { BeforeCreate, BeforeUpdate, Column, DataType, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation.js';
import { ServerNetworkProfile } from './ServerNetworkProfile.js';
import { SetNetworkProfile } from './SetNetworkProfile.js';

@Table
export class ChargingStationNetworkProfile
  extends Model
  implements ChargingStationNetworkProfileDto
{
  // Namespace enum not used as this is not a model required by CitrineOS
  static readonly MODEL_NAME: string = 'ChargingStationNetworkProfile';

  @Column({
    type: DataType.INTEGER,
    unique: 'stationPkId_configurationSlot',
  })
  declare stationPkId?: number;

  @Column({
    type: DataType.STRING,
  })
  declare stationId: string;

  /**
   * Possible values for a particular station found in device model:
   * OCPPCommCtrlr.NetworkConfigurationPriority.VariableCharacteristics.valuesList
   */
  @Column({
    type: DataType.INTEGER,
    unique: 'stationPkId_configurationSlot',
  })
  declare configurationSlot: number;

  @Column(DataType.INTEGER)
  declare setNetworkProfileId: number;

  declare setNetworkProfile: SetNetworkProfile;

  /**
   * If present, the websocket server that correlates to this configuration slot.
   * The ws url in the network profile may not match the configured host, for example in the cloud the
   * configured host will likely be behind a load balancer and a custom DNS name.
   *
   */
  @Column(DataType.STRING)
  declare websocketServerConfigId?: string;

  declare websocketServerConfig?: ServerNetworkProfile;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  declare tenant?: TenantDto;

  @BeforeCreate
  static async resolveStationPkId(instance: ChargingStationNetworkProfile): Promise<void> {
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
