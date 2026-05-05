// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsNumber } from 'class-validator';
import { ReportBaseEnumType } from '@enums/report-base.enum';

/** OCPP 2.0.1 / 2.1 GetBaseReport request. */

export class GetBaseReportRequest {
  @IsNumber()
  requestId: number;

  @IsEnum(ReportBaseEnumType)
  reportBase: ReportBaseEnumType;
}
