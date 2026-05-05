// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ConnectorEnumType } from '@enums/connector-type.enum';
import { IdTokenType } from '@dto/shared/id-token.dto';

/**
 * OCPP 2.0.1 / 2.1 ReserveNow request — pre-allocates a connector for
 * a known driver. The charger acknowledges with `Accepted` / `Faulted`
 * / `Occupied` / `Rejected` / `Unavailable`; on `Accepted` the
 * `Reservation` row in our DB stays active until either the
 * `expiryDateTime` lapses or a TransactionEvent.Started carrying the
 * matching `reservationId` arrives.
 *
 * @example
 * {
 *   "id": 7,
 *   "expiryDateTime": "2026-05-04T20:00:00Z",
 *   "evseId": 1,
 *   "connectorType": "cType2",
 *   "idToken": { "idToken": "0VU1N3M1FAPP_USER", "type": "Central" }
 * }
 */
export class ReserveNowRequest {
  /**
   * Reservation id chosen by the CSMS — echoed back by the charger
   * on the matching TransactionEvent and stored on the `Reservation` row.
   * @example 7
   */
  @IsNumber()
  id: number;

  /**
   * ISO-8601 timestamp after which the reservation auto-expires.
   * @example '2026-05-04T20:00:00Z'
   */
  @IsString()
  expiryDateTime: string;

  /**
   * Optional connector-type preference (e.g. `cType2`, `cCCS2`).
   * @example 'cType2'
   */
  @IsOptional()
  @IsEnum(ConnectorEnumType)
  connectorType?: ConnectorEnumType;

  /**
   * Optional EVSE pin — when omitted, any connector at the station
   * matching `connectorType` is acceptable.
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  evseId?: number;

  /** Token of the driver who reserved the slot. */
  @ValidateNested()
  @Type(() => IdTokenType)
  idToken: IdTokenType;

  /** Optional fleet/group token that authorised the reservation. */
  @IsOptional()
  @ValidateNested()
  @Type(() => IdTokenType)
  groupIdToken?: IdTokenType;
}
