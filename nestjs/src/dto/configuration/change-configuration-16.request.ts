// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsString } from 'class-validator';

/**
 * OCPP 1.6 ChangeConfiguration request. CSMS asks the charger to set a
 * single `(key, value)` pair on its Configuration Variables.
 */
export class ChangeConfiguration16Request {
  @IsString()
  key: string;

  @IsString()
  value: string;
}
