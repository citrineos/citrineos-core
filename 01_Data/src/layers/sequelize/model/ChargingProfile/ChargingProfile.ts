// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ChargingLimitSourceEnumType, ChargingProfileKindEnumType, ChargingProfilePurposeEnumType, ChargingProfileType, ChargingScheduleType, CustomDataType, Namespace, RecurrencyKindEnumType, TransactionType } from '@citrineos/base';
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Transaction } from '../TransactionEvent';
import { ChargingSchedule } from './ChargingSchedule';

@Table
export class ChargingProfile extends Model implements ChargingProfileType {
  static readonly MODEL_NAME: string = Namespace.ChargingProfile;

  /**
   * Fields
   */
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Column({
    type: DataType.STRING,
    unique: 'stationId_evseId_id',
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_evseId_id',
  })
  declare id: number;

  @Column(DataType.STRING)
  declare chargingProfileKind: ChargingProfileKindEnumType;

  @Column(DataType.STRING)
  declare chargingProfilePurpose: ChargingProfilePurposeEnumType;

  @Column(DataType.STRING)
  declare recurrencyKind?: RecurrencyKindEnumType;

  @Column(DataType.INTEGER)
  declare stackLevel: number;

  @Column({
    type: DataType.DATE,
    get() {
      const validFrom: Date = this.getDataValue('validFrom');
      return validFrom ? validFrom.toISOString() : null;
    },
  })
  declare validFrom?: string;

  @Column({
    type: DataType.DATE,
    get() {
      const validTo: Date = this.getDataValue('validTo');
      return validTo ? validTo.toISOString() : null;
    },
  })
  declare validTo?: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_evseId_id',
  })
  declare evseId: number;

  // this value indicates whether the ChargingProfile is set on charger
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: ChargingLimitSourceEnumType.CSO,
  })
  declare chargingLimitSource?: ChargingLimitSourceEnumType;

  /**
   * Relations
   */
  @HasMany(() => ChargingSchedule)
  declare chargingSchedule: [ChargingScheduleType] | [ChargingScheduleType, ChargingScheduleType] | [ChargingScheduleType, ChargingScheduleType, ChargingScheduleType];

  @ForeignKey(() => Transaction)
  declare transactionDatabaseId?: number;

  @BelongsTo(() => Transaction)
  declare transaction?: TransactionType;

  declare customData?: CustomDataType | undefined;
}
