// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Index, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { ServerNetworkProfile } from './ServerNetworkProfile';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

/**
 * The CallMessage model can be extended with new optional fields,
 * e.g. chargingProfileId, for other correlationId related lookups.
 */
@Table
export class SetNetworkProfile extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = 'SetNetworkProfile';

  @ForeignKey(() => ChargingStation)
  @Column(DataType.STRING)
  declare stationId: string;

  @Index
  @Column({
    type: DataType.STRING,
    unique: true,
  })
  declare correlationId: string;

  @ForeignKey(() => ServerNetworkProfile)
  @Column(DataType.STRING)
  declare websocketServerConfigId?: string;

  @BelongsTo(() => ServerNetworkProfile)
  declare websocketServerConfig?: ServerNetworkProfile;

  @Column(DataType.INTEGER)
  declare configurationSlot: number;

  @Column(DataType.STRING)
  declare ocppVersion: OCPP2_0_1.OCPPVersionEnumType;

  @Column(DataType.STRING)
  declare ocppTransport: OCPP2_0_1.OCPPTransportEnumType;

  /**
   * Communication_ Function. OCPP_ Central_ System_ URL. URI
   * urn:x-oca:ocpp:uid:1:569357
   * URL of the CSMS(s) that this Charging Station  communicates with.
   *
   */
  @Column(DataType.STRING)
  declare ocppCsmsUrl: string;

  /**
   * Duration in seconds before a message send by the Charging Station via this network connection times-out.
   * The best setting depends on the underlying network and response times of the CSMS.
   * If you are looking for a some guideline: use 30 seconds as a starting point.
   *
   */
  @Column(DataType.INTEGER)
  declare messageTimeout: number;

  /**
   * This field specifies the security profile used when connecting to the CSMS with this NetworkConnectionProfile.
   *
   */
  @Column(DataType.INTEGER)
  declare securityProfile: number;

  @Column(DataType.STRING)
  declare ocppInterface: OCPP2_0_1.OCPPInterfaceEnumType;

  /**
   * Stringified JSON of {@link OCPP2_0_1.APNType} for display purposes only
   *
   */
  @Column(DataType.STRING)
  declare apn?: string;

  /**
   * Stringified JSON of {@link OCPP2_0_1.VPNType} for display purposes only
   *
   */
  @Column(DataType.STRING)
  declare vpn?: string;
}
