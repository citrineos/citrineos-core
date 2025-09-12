// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto } from './base.dto';
import { ISetNetworkProfileDto } from './set.network.profile.dto';
import { IServerNetworkProfileDto } from './server.network.profile.dto';

export interface IChargingStationNetworkProfileDto extends IBaseDto {
  id?: number;
  stationId: string;
  configurationSlot: number;
  setNetworkProfileId: number;
  setNetworkProfile: ISetNetworkProfileDto;
  websocketServerConfigId?: string;
  websocketServerConfig?: IServerNetworkProfileDto;
}

export enum ChargingStationNetworkProfileDtoProps {
  stationId = 'stationId',
  configurationSlot = 'configurationSlot',
  setNetworkProfileId = 'setNetworkProfileId',
  setNetworkProfile = 'setNetworkProfile',
  websocketServerConfigId = 'websocketServerConfigId',
  websocketServerConfig = 'websocketServerConfig',
}
