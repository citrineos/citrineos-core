// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber, Max, Min } from 'class-validator';

/**
 * OCPP 2.0.1 / 2.1 SetMonitoringLevel request.
 *
 * `severity` is 0–9 per the spec — anything outside that range is
 * rejected up front by class-validator.
 */
export class SetMonitoringLevelRequest {
  @IsNumber()
  @Min(0)
  @Max(9)
  severity: number;
}
