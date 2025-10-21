// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ReservationDto, TenantDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import {
  AutoIncrement,
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { EvseType } from './DeviceModel/index.js';
import { Tenant } from './Tenant.js';

@Table
export class Reservation extends Model implements ReservationDto {
  static readonly MODEL_NAME: string = Namespace.ReserveNowRequest;

  /**
   * Fields
   */
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_id',
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    unique: 'stationId_id',
  })
  declare stationId: string;

  @Column({
    type: DataType.DATE,
    get() {
      const expiryDateTime: Date = this.getDataValue('expiryDateTime');
      return expiryDateTime ? expiryDateTime.toISOString() : null;
    },
  })
  declare expiryDateTime: string;

  @Column(DataType.STRING)
  declare connectorType?: string | null;

  @Column(DataType.STRING)
  declare reserveStatus?: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isActive: boolean;

  @Column(DataType.STRING)
  declare terminatedByTransaction?: string | null;

  @Column(DataType.JSONB)
  declare idToken: object;

  @Column(DataType.JSONB)
  declare groupIdToken?: object | null;

  /**
   * Relations
   */
  @ForeignKey(() => EvseType)
  declare evseId?: number | null;

  @BelongsTo(() => EvseType)
  declare evse?: EvseType | null;

  declare customData?: any | null;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: Reservation) {
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
