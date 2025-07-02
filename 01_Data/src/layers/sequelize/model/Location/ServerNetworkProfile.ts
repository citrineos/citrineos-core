// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1_Namespace, OCPPVersionType, WebsocketServerConfig } from '@citrineos/base';
import { BelongsToMany, Column, DataType, PrimaryKey, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { ChargingStationNetworkProfile } from './ChargingStationNetworkProfile';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class ServerNetworkProfile extends BaseModelWithTenant implements WebsocketServerConfig {
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
}
