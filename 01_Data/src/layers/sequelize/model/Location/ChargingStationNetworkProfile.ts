// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { ServerNetworkProfile } from './ServerNetworkProfile';
import { SetNetworkProfile } from './SetNetworkProfile';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class ChargingStationNetworkProfile extends BaseModelWithTenant {
  // Namespace enum not used as this is not a model required by CitrineOS
  static readonly MODEL_NAME: string = 'ChargingStationNetworkProfile';

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.STRING,
    unique: 'stationId_configurationSlot',
  })
  declare stationId: string;

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

  @BelongsTo(() => SetNetworkProfile)
  declare setNetworkProfile: SetNetworkProfile;

  /**
   * If present, the websocket server that correlates to this configuration slot.
   * The ws url in the network profile may not match the configured host, for example in the cloud the
   * configured host will likely be behind a load balancer and a custom DNS name.
   *
   */
  @ForeignKey(() => ServerNetworkProfile)
  @Column(DataType.STRING)
  declare websocketServerConfigId?: string;

  @BelongsTo(() => ServerNetworkProfile)
  declare websocketServerConfig?: ServerNetworkProfile;
}
