// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CustomDataType, ModemType, Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Location } from './Location';

/**
 * Represents a charging station.
 * Currently, this data model is internal to CitrineOS. In the future, it will be analogous to an OCPI ChargingStation.
 */
@Table
export class ChargingStation extends Model {
  static readonly MODEL_NAME: string = Namespace.ChargingStation;

  @PrimaryKey
  @Column(DataType.STRING(36))
  declare id: string;

  @Column
  declare isOnline: boolean;

  @ForeignKey(() => Location)
  @Column(DataType.INTEGER)
  declare locationId?: number;

  /**
   * Fields from ChargingStationType
   */
  @Column
  declare customData?: CustomDataType | undefined;

  @Column(DataType.STRING)
  declare firmwareVersion?: string;

  @Column(DataType.STRING)
  declare model?: string;

  @Column(DataType.STRING)
  declare modem?: ModemType;

  @Column(DataType.STRING)
  declare serialNumber?: string;

  @Column(DataType.STRING)
  declare vendorName?: string;

  /**
   * The business Location of the charging station. Optional in case a charging station is not yet in the field, or retired.
   */
  @BelongsTo(() => Location)
  declare location?: Location;
}
