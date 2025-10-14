// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBootDto, Namespace } from '@citrineos/base';
import { Column, DataType, HasMany, PrimaryKey, Table } from 'sequelize-typescript';
import { VariableAttribute } from './DeviceModel';
import { BaseModelWithTenant } from './BaseModelWithTenant';

@Table
export class Boot extends BaseModelWithTenant implements IBootDto {
  static readonly MODEL_NAME: string = Namespace.BootConfig;

  /**
   * StationId
   */
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @Column({
    type: DataType.DATE,
    get() {
      const lastBootTimeValue = this.getDataValue('lastBootTime');
      return lastBootTimeValue ? lastBootTimeValue.toISOString() : null;
    },
  })
  declare lastBootTime?: string | null;

  @Column(DataType.INTEGER)
  declare heartbeatInterval?: number | null;

  @Column(DataType.INTEGER)
  declare bootRetryInterval?: number | null;

  @Column(DataType.STRING)
  declare status: string;

  @Column(DataType.JSON)
  declare statusInfo?: object | null;

  @Column(DataType.BOOLEAN)
  declare getBaseReportOnPending?: boolean | null;

  /**
   * Variable attributes to be sent in SetVariablesRequest on pending boot
   */
  @HasMany(() => VariableAttribute)
  declare pendingBootSetVariables?: VariableAttribute[];

  @Column(DataType.JSON)
  declare variablesRejectedOnLastBoot?: object[] | null;

  @Column(DataType.BOOLEAN)
  declare bootWithRejectedVariables?: boolean | null;

  @Column(DataType.BOOLEAN)
  declare changeConfigurationsOnPending?: boolean | null;

  @Column(DataType.BOOLEAN)
  declare getConfigurationsOnPending?: boolean | null;

  declare customData?: object | null;
}
