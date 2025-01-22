// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { Boot } from '../../model/Boot';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class BootMapper extends AbstractMapper<Boot> {
  id: string;
  lastBootTime?: string | null;
  heartbeatInterval?: number | null;
  bootRetryInterval?: number | null;
  @IsEnum(OCPP2_0_1.RegistrationStatusEnumType)
  status: OCPP2_0_1.RegistrationStatusEnumType;
  statusInfo?: OCPP2_0_1.StatusInfoType | null;
  getBaseReportOnPending?: boolean | null;
  pendingBootSetVariables?: OCPP2_0_1.VariableAttributeType[] | null;
  @IsNotEmpty()
  variablesRejectedOnLastBoot: OCPP2_0_1.SetVariableResultType[];
  bootWithRejectedVariables?: boolean | null;
  customData?: OCPP2_0_1.CustomDataType | null;

  constructor(
    id: string,
    status: OCPP2_0_1.RegistrationStatusEnumType,
    variablesRejectedOnLastBoot: OCPP2_0_1.SetVariableResultType[],
    lastBootTime?: string | null,
    heartbeatInterval?: number | null,
    bootRetryInterval?: number | null,
    statusInfo?: OCPP2_0_1.StatusInfoType | null,
    getBaseReportOnPending?: boolean | null,
    pendingBootSetVariables?: OCPP2_0_1.VariableAttributeType[] | null,
    bootWithRejectedVariables?: boolean | null,
    customData?: OCPP2_0_1.CustomDataType | null,
  ) {
    super();
    this.id = id;
    this.status = status;
    this.variablesRejectedOnLastBoot = variablesRejectedOnLastBoot;
    this.lastBootTime = lastBootTime;
    this.heartbeatInterval = heartbeatInterval;
    this.bootRetryInterval = bootRetryInterval;
    this.statusInfo = statusInfo;
    this.getBaseReportOnPending = getBaseReportOnPending;
    this.pendingBootSetVariables = pendingBootSetVariables;
    this.bootWithRejectedVariables = bootWithRejectedVariables;
    this.customData = customData;

    this.validate();
  }

  toModel(): Boot {
    return Boot.build({
      id: this.id,
      status: this.status,
      variablesRejectedOnLastBoot: this.variablesRejectedOnLastBoot,
      lastBootTime: this.lastBootTime,
      heartbeatInterval: this.heartbeatInterval,
      bootRetryInterval: this.bootRetryInterval,
      statusInfo: this.statusInfo,
      getBaseReportOnPending: this.getBaseReportOnPending,
      pendingBootSetVariables: this.pendingBootSetVariables,
      bootWithRejectedVariables: this.bootWithRejectedVariables,
      customData: this.customData,
    });
  }

  static fromModel(boot: Boot): BootMapper {
    return new BootMapper(
      boot.id,
      boot.status as OCPP2_0_1.RegistrationStatusEnumType,
      boot.variablesRejectedOnLastBoot as OCPP2_0_1.SetVariableResultType[],
      boot.lastBootTime,
      boot.heartbeatInterval,
      boot.bootRetryInterval,
      boot.statusInfo ? (boot.statusInfo as OCPP2_0_1.StatusInfoType) : boot.statusInfo,
      boot.getBaseReportOnPending,
      boot.pendingBootSetVariables ? (boot.pendingBootSetVariables as OCPP2_0_1.VariableAttributeType[]) : boot.pendingBootSetVariables,
      boot.bootWithRejectedVariables,
      boot.customData ? (boot.customData as OCPP2_0_1.CustomDataType) : boot.customData,
    );
  }
}
