// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsDateString, IsNumber, ValidateNested } from 'class-validator';
import { ChargingScheduleType } from '@dto/shared/charging-schedule.dto';

/**
 * OCPP 2.0.1 / 2.1 NotifyEVChargingSchedule request — charger forwards
 * the EV's expected charging schedule (ISO 15118 negotiated). The CSMS
 * acks `{ status: Accepted | Rejected }`; we always Accept.
 */
export class NotifyEVChargingScheduleRequest {
  @IsDateString()
  timeBase: string;

  @IsNumber()
  evseId: number;

  @ValidateNested()
  @Type(() => ChargingScheduleType)
  chargingSchedule: ChargingScheduleType;
}
