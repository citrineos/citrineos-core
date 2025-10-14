// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP2_0_1 } from '../..';
import { IBaseDto } from './base.dto';
import { IServerNetworkProfileDto } from './server.network.profile.dto';

export interface ISetNetworkProfileDto extends IBaseDto {
  id?: number;
  stationId: string;
  correlationId: string;
  websocketServerConfigId?: string;
  websocketServerConfig?: IServerNetworkProfileDto;
  configurationSlot: number;
  ocppVersion: OCPP2_0_1.OCPPVersionEnumType;
  ocppTransport: OCPP2_0_1.OCPPTransportEnumType;
  ocppCsmsUrl: string;
  messageTimeout: number;
  securityProfile: number;
  ocppInterface: OCPP2_0_1.OCPPInterfaceEnumType;
  apn?: string;
  vpn?: string;
}

export enum SetNetworkProfileDtoProps {
  stationId = 'stationId',
  correlationId = 'correlationId',
  websocketServerConfigId = 'websocketServerConfigId',
  websocketServerConfig = 'websocketServerConfig',
  configurationSlot = 'configurationSlot',
  ocppVersion = 'ocppVersion',
  ocppTransport = 'ocppTransport',
  ocppCsmsUrl = 'ocppCsmsUrl',
  messageTimeout = 'messageTimeout',
  securityProfile = 'securityProfile',
  ocppInterface = 'ocppInterface',
  apn = 'apn',
  vpn = 'vpn',
}
