// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace, OCPPVersion } from '@citrineos/base';
import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Location } from './Location';
import { StatusNotification } from './StatusNotification';
import { ChargingStationNetworkProfile } from './ChargingStationNetworkProfile';
import { SetNetworkProfile } from './SetNetworkProfile';
import { Connector } from './Connector';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

/**
 * Represents a charging station.
 * Currently, this data model is internal to CitrineOS. In the future, it will be analogous to an OCPI ChargingStation.
 */
@Table
export class ChargingStation extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = Namespace.ChargingStation;

  @PrimaryKey
  @Column(DataType.STRING(36))
  declare id: string;

  @Column
  declare isOnline: boolean;

  @Column(DataType.STRING)
  declare protocol?: OCPPVersion | null;

  @Column(DataType.STRING(20))
  declare chargePointVendor?: string | null;

  @Column(DataType.STRING(20))
  declare chargePointModel?: string | null;

  @Column(DataType.STRING(25))
  declare chargePointSerialNumber?: string | null;

  @Column(DataType.STRING(25))
  declare chargeBoxSerialNumber?: string | null;

  @Column(DataType.STRING(50))
  declare firmwareVersion?: string | null;

  @Column(DataType.STRING(20))
  declare iccid?: string | null;

  @Column(DataType.STRING(20))
  declare imsi?: string | null;

  @Column(DataType.STRING(25))
  declare meterType?: string | null;

  @Column(DataType.STRING(25))
  declare meterSerialNumber?: string | null;

  @ForeignKey(() => Location)
  @Column(DataType.INTEGER)
  declare locationId?: number | null;

  @HasMany(() => StatusNotification)
  declare statusNotifications?: StatusNotification[] | null;

  /**
   * The business Location of the charging station. Optional in case a charging station is not yet in the field, or retired.
   */
  @BelongsTo(() => Location)
  declare location?: Location;

  @BelongsToMany(() => SetNetworkProfile, () => ChargingStationNetworkProfile)
  declare networkProfiles?: SetNetworkProfile[] | null;

  @HasMany(() => Connector, {
    onDelete: 'CASCADE',
  })
  declare connectors?: Connector[] | null;
}
