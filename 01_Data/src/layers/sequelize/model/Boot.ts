// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type BootConfig, Namespace } from '@citrineos/base';
import { Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { VariableAttribute } from './DeviceModel';

@Table
export class Boot extends Model implements BootConfig {
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
  declare lastBootTime?: string;

  @Column(DataType.INTEGER)
  declare heartbeatInterval?: number;

  @Column(DataType.INTEGER)
  declare bootRetryInterval?: number;

  @Column(DataType.STRING)
  declare status: string;

  @Column(DataType.JSON)
  declare statusInfo?: object;

  @Column(DataType.BOOLEAN)
  declare getBaseReportOnPending?: boolean;

  /**
   * Variable attributes to be sent in SetVariablesRequest on pending boot
   */
  @HasMany(() => VariableAttribute)
  declare pendingBootSetVariables?: VariableAttribute[];

  @Column(DataType.JSON)
  declare variablesRejectedOnLastBoot: object[];

  @Column(DataType.BOOLEAN)
  declare bootWithRejectedVariables?: boolean;

  @Column(DataType.BOOLEAN)
  declare changeConfigurationsOnPending?: boolean;

  @Column(DataType.BOOLEAN)
  declare getConfigurationsOnPending?: boolean;

  declare customData?: object;
}
