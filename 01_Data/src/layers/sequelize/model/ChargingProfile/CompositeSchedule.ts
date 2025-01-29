// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1_Namespace, OCPP2_0_1 } from '@citrineos/base';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class CompositeSchedule extends Model implements OCPP2_0_1.CompositeScheduleType {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.CompositeSchedule;

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
  declare chargingRateUnit: OCPP2_0_1.ChargingRateUnitEnumType;

  @Column(DataType.JSONB)
  declare chargingSchedulePeriod: [OCPP2_0_1.ChargingSchedulePeriodType, ...OCPP2_0_1.ChargingSchedulePeriodType[]];

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
