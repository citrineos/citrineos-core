// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1_Namespace } from '@citrineos/base';
import { Column, DataType, HasMany, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { Point } from 'geojson';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

/**
 * Represents a location.
 * Currently, this data model is internal to CitrineOS. In the future, it will be analogous to an OCPI Location.
 */
@Table
export class Location extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.Location;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare address: string;

  @Column(DataType.STRING)
  declare city: string;

  @Column(DataType.STRING)
  declare postalCode: string;

  @Column(DataType.STRING)
  declare state: string;

  @Column(DataType.STRING)
  declare country: string;

  /**
   * [longitude, latitude]
   */
  @Column(DataType.GEOMETRY('POINT'))
  declare coordinates: Point;

  @HasMany(() => ChargingStation)
  declare chargingPool: [ChargingStation, ...ChargingStation[]];
}
