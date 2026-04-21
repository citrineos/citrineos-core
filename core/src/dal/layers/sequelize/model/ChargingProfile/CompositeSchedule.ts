// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { CompositeScheduleDto, EvseDto, TenantDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Evse } from '../Location/index.js';
import { Tenant } from '../Tenant.js';

@Table
export class CompositeSchedule extends Model implements CompositeScheduleDto {
  static readonly MODEL_NAME: string = Namespace.CompositeSchedule;

  @Column(DataType.STRING)
  declare stationId: string;

  @ForeignKey(() => Evse)
  @Column(DataType.INTEGER)
  declare evseId: number;

  @BelongsTo(() => Evse, 'evseId')
  declare evse?: EvseDto;

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

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: CompositeSchedule) {
    if (instance.tenantId == null) {
      instance.tenantId = DEFAULT_TENANT_ID;
    }
  }

  constructor(...args: any[]) {
    super(...args);
    if (this.tenantId == null) {
      this.tenantId = DEFAULT_TENANT_ID;
    }
  }
}
