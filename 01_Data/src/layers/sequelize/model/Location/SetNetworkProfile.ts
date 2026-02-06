// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, OCPP2_0_1 } from '@citrineos/base';
import type { TenantDto } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Index,
  Model,
  Table,
} from 'sequelize-typescript';
import { Tenant } from '../Tenant.js';
import { ChargingStation } from './ChargingStation.js';
import { ServerNetworkProfile } from './ServerNetworkProfile.js';

/**
 * The CallMessage model can be extended with new optional fields,
 * e.g. chargingProfileId, for other correlationId related lookups.
 */
@Table
export class SetNetworkProfile extends Model {
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
  static setDefaultTenant(instance: SetNetworkProfile) {
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
