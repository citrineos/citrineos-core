// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { IdTokenType } from '@dto/shared/id-token.dto';

/**
 * OCPP 2.0.1 / 2.1 RequestStartTransaction request — initiates a
 * charging session remotely (mobile app, fleet dashboard, etc.) instead
 * of physically presenting the token at the charger.
 *
 * The charger acknowledges with `Accepted` / `Rejected` and (on Accepted)
 * fires a `TransactionEvent.Started` carrying the operator-supplied
 * `remoteStartId` so we can stitch the round-trip back together.
 *
 * @example
 * {
 *   "remoteStartId": 42,
 *   "evseId": 1,
 *   "idToken": { "idToken": "0VU1N3M1FAPP_USER", "type": "Central" }
 * }
 */
export class RequestStartTransactionRequest {
  /**
   * Operator-supplied id, echoed back by the charger on the resulting
   * TransactionEvent so the pending REST call can resolve.
   * @example 42
   */
  @IsNumber()
  remoteStartId: number;

  /** Token of the driver who'll receive the session. */
  @ValidateNested()
  @Type(() => IdTokenType)
  idToken: IdTokenType;

  /**
   * EVSE to start the session on. Omit to let the charger pick.
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  evseId?: number;

  /** Optional fleet/group token authorising the start. */
  @IsOptional()
  @ValidateNested()
  @Type(() => IdTokenType)
  groupIdToken?: IdTokenType;

  /**
   * `chargingProfile` accepted opaquely — the smart-charging module owns
   * full validation when the charger forwards it back via SetChargingProfile.
   */
  @IsOptional()
  chargingProfile?: Record<string, unknown>;
}
