// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto } from './base.dto';
import { IVariableMonitoringDto } from './variable.monitoring.dto';
import { OCPP2_0_1 } from '../..';

export interface IVariableMonitoringStatusDto extends IBaseDto {
  id?: number;
  status: string;
  statusInfo?: OCPP2_0_1.StatusInfoType | null;
  variable: IVariableMonitoringDto;
  variableMonitoringId?: number | null;
  //   customData?: OCPP2_0_1.CustomDataType | null;
}

export enum VariableMonitoringStatusDtoProps {
  status = 'status',
  statusInfo = 'statusInfo',
  variable = 'variable',
  variableMonitoringId = 'variableMonitoringId',
  customData = 'customData',
}
