// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsArray, IsOptional, IsString } from 'class-validator';

/**
 * OCPP 1.6 GetConfiguration request. CSMS asks the charger to return
 * its Configuration Variables. `key` is optional — when omitted, the
 * charger returns the full set.
 */
export class GetConfiguration16Request {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  key?: string[];
}
