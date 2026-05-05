// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ResetTypeEnumType } from '@enums/reset-type.enum';

/**
 * OCPP 2.0.1 / 2.1 Reset request — instructs the charger to reboot.
 *
 * `Immediate` resets even if a transaction is active (cancels it);
 * `OnIdle` defers the reset until the charger has no active transaction;
 * `ImmediateAndResume` (2.1 only) resumes the transaction post-reboot.
 *
 * Scope can be narrowed to one EVSE via `evseId`; omit to reset the
 * whole station.
 *
 * @example
 * { "type": "Immediate" }
 */
export class ResetRequest {
  /**
   * Reset semantics.
   * @example 'Immediate'
   */
  @IsEnum(ResetTypeEnumType)
  type: ResetTypeEnumType;

  /**
   * Optional EVSE id to narrow the reset scope. Omit to reset the
   * whole station.
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  evseId?: number;
}
