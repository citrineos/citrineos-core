// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Evse } from './DeviceModel';
import { BaseModelWithTenant } from './BaseModelWithTenant';

@Table
export class Reservation extends BaseModelWithTenant {
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
  @ForeignKey(() => Evse)
  declare evseId?: number | null;

  @BelongsTo(() => Evse)
  declare evse?: Evse;

  declare customData?: any | null;
}
