// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum } from 'class-validator';
import { MonitoringBaseEnumType } from '@enums/monitoring-base.enum';

/** OCPP 2.0.1 / 2.1 SetMonitoringBase request. */

export class SetMonitoringBaseRequest {
  @IsEnum(MonitoringBaseEnumType)
  monitoringBase: MonitoringBaseEnumType;
}
