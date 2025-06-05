// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { Column, DataType, Table } from 'sequelize-typescript';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class CompositeSchedule extends BaseModelWithTenant {
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
  declare chargingRateUnit: string;

  @Column(DataType.JSONB)
  declare chargingSchedulePeriod: [object, ...object[]];

  declare customData?: object | null;
}
