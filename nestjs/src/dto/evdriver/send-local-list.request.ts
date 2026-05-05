// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { UpdateEnumType } from '@enums/update-type.enum';
import { AuthorizationData } from '@dto/shared/authorization-data.dto';

/**
 * OCPP 2.0.1 / 2.1 SendLocalList request — pushes the offline auth
 * list to the charger so it can keep authorising tokens during a CSMS
 * outage. `Full` replaces the whole list at the new `versionNumber`;
 * `Differential` patches it (omit `localAuthorizationList[].idTokenInfo`
 * to evict).
 *
 * On `Accepted` the CSMS persists the new `versionNumber` for that
 * station via `LocalAuthListVersions` so the next round-trip can detect
 * mismatch.
 *
 * @example
 * {
 *   "versionNumber": 12,
 *   "updateType": "Full",
 *   "localAuthorizationList": [
 *     {
 *       "idToken": { "idToken": "0VU1N3M1FAPP_USER", "type": "Central" },
 *       "idTokenInfo": { "status": "Accepted" }
 *     }
 *   ]
 * }
 */
export class SendLocalListRequest {
  /**
   * Monotonically increasing version. Charger rejects updates whose
   * version isn't strictly greater than the currently-installed one.
   * @example 12
   */
  @IsNumber()
  versionNumber: number;

  /**
   * `Full` — replace; `Differential` — patch.
   * @example 'Full'
   */
  @IsEnum(UpdateEnumType)
  updateType: UpdateEnumType;

  /**
   * Authorisation entries. Required for `Full`; for `Differential` an
   * entry without `idTokenInfo` evicts the matching token.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthorizationData)
  localAuthorizationList?: AuthorizationData[];
}
