// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto, IVariableAttributeDto } from '../..';

export interface IBootDto extends IBaseDto {
  id: string;
  lastBootTime?: string | null;
  heartbeatInterval?: number | null;
  bootRetryInterval?: number | null;
  status: any;
  statusInfo?: object | null;
  getBaseReportOnPending?: boolean | null;
  pendingBootSetVariables?: IVariableAttributeDto[];
  variablesRejectedOnLastBoot?: object[] | null;
  bootWithRejectedVariables?: boolean | null;
  changeConfigurationsOnPending?: boolean | null;
  getConfigurationsOnPending?: boolean | null;
}
