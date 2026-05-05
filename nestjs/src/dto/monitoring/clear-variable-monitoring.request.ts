// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ArrayMinSize, IsArray, IsNumber } from 'class-validator';

/** OCPP 2.0.1 / 2.1 ClearVariableMonitoring request. */

export class ClearVariableMonitoringRequest {
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  id: number[];
}
