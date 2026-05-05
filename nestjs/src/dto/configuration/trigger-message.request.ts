// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { MessageTriggerEnumType } from '@enums/message-trigger.enum';
import { EVSEType } from '@dto/shared/evse.dto';

/**
 * OCPP 2.0.1 / 2.1 TriggerMessage request — asks the charger to
 * proactively send one of the standard charger-initiated messages
 * (`Heartbeat`, `BootNotification`, `StatusNotification`, `MeterValues`,
 * `SignChargingStationCertificate`, `TransactionEvent`, etc.).
 *
 * Use cases:
 *   - Force a `MeterValues` to refresh stale dashboard data without
 *     waiting for the next periodic sample.
 *   - Trigger a `BootNotification` after operator config changes to
 *     force the charger to re-read its bootstrap settings.
 *
 * @example
 * { "requestedMessage": "MeterValues", "evse": { "id": 1 } }
 */
export class TriggerMessageRequest {
  /**
   * Which charger-initiated message to trigger.
   * @example 'MeterValues'
   */
  @IsEnum(MessageTriggerEnumType)
  requestedMessage: MessageTriggerEnumType;

  /**
   * Optional EVSE scope when the trigger is per-EVSE
   * (e.g. `MeterValues`, `StatusNotification`).
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => EVSEType)
  evse?: EVSEType;

  /** Vendor-specific custom trigger payload — passed through verbatim. */
  @IsOptional()
  @IsString()
  customTrigger?: string;
}
