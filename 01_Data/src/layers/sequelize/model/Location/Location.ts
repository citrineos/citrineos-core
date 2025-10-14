// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  LocationHours,
  ILocationDto,
  LocationFacilityType,
  LocationParkingType,
  OCPP2_0_1_Namespace,
} from '@citrineos/base';
import { Column, DataType, HasMany, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';
import { Point } from 'geojson';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

/**
 * Represents a location.
 * Currently, this data model is internal to CitrineOS. In the future, it will be analogous to an OCPI Location.
 */
@Table
export class Location extends BaseModelWithTenant implements ILocationDto {
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

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare publishUpstream: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: 'UTC',
    validate: {
      isTimezone(value: string) {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: value });
          return true;
        } catch (ex) {
          return false;
        }
      },
    },
  })
  declare timeZone: string;

  @Column(DataType.STRING)
  declare parkingType?: LocationParkingType | null;

  @Column(DataType.JSONB)
  declare facilities?: LocationFacilityType[] | null;

  @Column(DataType.JSONB)
  declare openingHours?: LocationHours | null;

  /**
   * [longitude, latitude]
   */
  @Column(DataType.GEOMETRY('POINT'))
  declare coordinates: Point;

  @HasMany(() => ChargingStation)
  declare chargingPool: [ChargingStation, ...ChargingStation[]];
}
