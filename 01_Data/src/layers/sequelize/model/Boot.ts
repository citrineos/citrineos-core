// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type BootConfig, Namespace, OCPP2_0_1 } from '@citrineos/base';
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
  declare status: OCPP2_0_1.RegistrationStatusEnumType;

  @Column(DataType.JSON)
  declare statusInfo?: OCPP2_0_1.StatusInfoType;

  @Column(DataType.BOOLEAN)
  declare getBaseReportOnPending?: boolean;

  /**
   * Variable attributes to be sent in SetVariablesRequest on pending boot
   */
  @HasMany(() => VariableAttribute)
  declare pendingBootSetVariables?: VariableAttribute[];

  @Column(DataType.JSON)
  declare variablesRejectedOnLastBoot: OCPP2_0_1.SetVariableResultType[];

  @Column(DataType.BOOLEAN)
  declare bootWithRejectedVariables?: boolean;

  declare customData?: OCPP2_0_1.CustomDataType;
}
