// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation';

/**
 * Represents a location.
 * Currently, this data model is internal to CitrineOS. In the future, it will be analogous to an OCPI Location.
 */
@Table
export class Location extends Model {
  static readonly MODEL_NAME: string = Namespace.Location;

  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
  })
  declare id: number;

  @Column(DataType.STRING)
  declare name: string;

  /**
   * [longitude, latitude]
   */
  @Column(DataType.GEOMETRY('POINT'))
  declare coordinates: [number, number];

  @HasMany(() => ChargingStation)
  declare chargingPool: [ChargingStation, ...ChargingStation[]];
}
