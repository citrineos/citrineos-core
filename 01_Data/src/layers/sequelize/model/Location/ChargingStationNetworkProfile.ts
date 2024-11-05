// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation'
import { ServerNetworkProfile } from './ServerNetworkProfile'
import { SetNetworkProfile } from './SetNetworkProfile'

@Table
export class ChargingStationNetworkProfile extends Model {
    // Namespace enum not used as this is not a model required by CitrineOS
    static readonly MODEL_NAME: string = 'ChargingStationNetworkProfile';

    @ForeignKey(() => ChargingStation)
    @Column({
        type: DataType.STRING,
        unique: 'stationId_configurationSlot'
    })
    declare stationId: string;

    /**
     * Possible values for a particular station found in device model:
     * OCPPCommCtrlr.NetworkConfigurationPriority.VariableCharacteristics.valuesList
     */
    @Column({
        type: DataType.INTEGER,
        unique: 'stationId_configurationSlot'
    })
    declare configurationSlot: number;

    /**
     * From {@link SetNetworkProfile} which was last accepted by this station for this configuration slot
     */
    @Column(DataType.STRING)
    declare setNetworkProfileCorrelationId: string;

    /**
     * If present, the websocket server that correlates to this configuration slot.
     * The ws url in the network profile may not match the configured host, for example in the cloud the 
     * configured host will likely be behind a load balancer and a custom DNS name.
     * 
     */
    @ForeignKey(() => ServerNetworkProfile)
    @Column(DataType.STRING)
    declare websocketServerConfigId?: string;
}
