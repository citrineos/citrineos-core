// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1_Namespace, OCPP2_0_1 } from '@citrineos/base';
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Transaction } from '../TransactionEvent';
import { ChargingSchedule } from './ChargingSchedule';

@Table
export class ChargingProfile extends Model implements OCPP2_0_1.ChargingProfileType {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.ChargingProfile;

  /**
   * Fields
   */
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Column({
    type: DataType.STRING,
    unique: 'stationId_id',
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_id',
  })
  declare id: number;

  @Column(DataType.STRING)
  declare chargingProfileKind: OCPP2_0_1.ChargingProfileKindEnumType;

  @Column(DataType.STRING)
  declare chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType;

  @Column(DataType.STRING)
  declare recurrencyKind?: OCPP2_0_1.RecurrencyKindEnumType | null;

  @Column(DataType.INTEGER)
  declare stackLevel: number;

  @Column({
    type: DataType.DATE,
    get() {
      const validFrom: Date = this.getDataValue('validFrom');
      return validFrom ? validFrom.toISOString() : null;
    },
  })
  declare validFrom?: string | null;

  @Column({
    type: DataType.DATE,
    get() {
      const validTo: Date = this.getDataValue('validTo');
      return validTo ? validTo.toISOString() : null;
    },
  })
  declare validTo?: string | null;

  @Column(DataType.INTEGER)
  declare evseId?: number | null;

  // this value indicates whether the ChargingProfile is set on charger
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: OCPP2_0_1.ChargingLimitSourceEnumType.CSO,
  })
  declare chargingLimitSource?: OCPP2_0_1.ChargingLimitSourceEnumType | null;

  /**
   * Relations
   */
  @HasMany(() => ChargingSchedule)
  declare chargingSchedule: [OCPP2_0_1.ChargingScheduleType] | [OCPP2_0_1.ChargingScheduleType, OCPP2_0_1.ChargingScheduleType] | [OCPP2_0_1.ChargingScheduleType, OCPP2_0_1.ChargingScheduleType, OCPP2_0_1.ChargingScheduleType];

  @ForeignKey(() => Transaction)
  declare transactionDatabaseId?: number | null;

  @BelongsTo(() => Transaction)
  declare transaction?: OCPP2_0_1.TransactionType;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
