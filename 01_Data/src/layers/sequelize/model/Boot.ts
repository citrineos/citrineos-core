// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type BootConfig, type CustomDataType, Namespace, RegistrationStatusEnumType, type SetVariableResultType, StatusInfoType } from '@citrineos/base';
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
      return this.getDataValue('lastBootTime').toISOString();
    },
  })
  declare lastBootTime?: string;

  @Column(DataType.INTEGER)
  declare heartbeatInterval?: number;

  @Column(DataType.INTEGER)
  declare bootRetryInterval?: number;

  @Column(DataType.STRING)
  declare status: RegistrationStatusEnumType;

  @Column(DataType.JSON)
  declare statusInfo?: StatusInfoType;

  @Column(DataType.BOOLEAN)
  declare getBaseReportOnPending?: boolean;

  /**
   * Variable attributes to be sent in SetVariablesRequest on pending boot
   */
  @HasMany(() => VariableAttribute)
  declare pendingBootSetVariables?: VariableAttribute[];

  @Column(DataType.JSON)
  declare variablesRejectedOnLastBoot: SetVariableResultType[];

  @Column(DataType.BOOLEAN)
  declare bootWithRejectedVariables?: boolean;

  declare customData?: CustomDataType;
}
