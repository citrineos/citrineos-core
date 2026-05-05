// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { IdTokenEnumType } from '@enums/id-token.enum';
import { AdditionalInfoType } from '@dto/shared/additional-info.dto';

/**
 * OCPP `IdToken` — the EV driver / vehicle identifier presented to the
 * charger. Composed into `Authorize`, `TransactionEvent` (idToken),
 * `RequestStartTransaction`, `ReserveNow`, etc.
 *
 * @example
 * { "idToken": "0VU1N3M1FAPP_USER", "type": "Central" }
 */
export class IdTokenType {
  /**
   * The token value as scanned/presented at the charger. Up to 36 chars.
   * @example '0VU1N3M1FAPP_USER'
   */
  @IsString()
  idToken: string;

  /**
   * Token type per OCPP `IdTokenEnumType` — `Central` for back-office
   * tokens, `eMAID` for ISO 15118 contract certificates, `ISO14443` /
   * `ISO15693` for RFID/NFC, `KeyCode`, `Local`, `MacAddress`,
   * `NoAuthorization`.
   * @example 'Central'
   */
  @IsEnum(IdTokenEnumType)
  type: IdTokenEnumType;

  /**
   * Optional vendor-specific extra identifiers (e.g. PaymentTerminal IDs).
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalInfoType)
  additionalInfo?: AdditionalInfoType[];
}
