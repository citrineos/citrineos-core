// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ChargingRateUnitEnumType, ChargingSchedulePeriodType, CompositeScheduleType, CustomDataType, Namespace } from '@citrineos/base';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class CompositeSchedule extends Model implements CompositeScheduleType {
  static readonly MODEL_NAME: string = Namespace.CompositeSchedule;

  @Column(DataType.STRING)
  declare stationId: string;

  @Column(DataType.INTEGER)
  declare evseId: number;

  @Column(DataType.INTEGER)
  declare duration: number;

  @Column({
    type: DataType.DATE,
    get() {
      const scheduleStart: Date = this.getDataValue('scheduleStart');
      return scheduleStart ? scheduleStart.toISOString() : null;
    },
  })
  declare scheduleStart: string;

  @Column(DataType.STRING)
  declare chargingRateUnit: ChargingRateUnitEnumType;

  @Column(DataType.JSONB)
  declare chargingSchedulePeriod: [ChargingSchedulePeriodType, ...ChargingSchedulePeriodType[]];

  declare customData?: CustomDataType | undefined;
}
