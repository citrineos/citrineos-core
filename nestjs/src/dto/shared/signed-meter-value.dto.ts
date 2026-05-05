// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsOptional, IsString } from 'class-validator';

/**
 * OCPP 2.0.1 / 2.1 SignedMeterValueType — the cryptographic envelope on
 * a SampledValue. Mirrors `base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts`.
 *
 * `publicKey` is optional when the charging station's public key is
 * already on file (configured via `signedMeterValuesConfiguration` and
 * stored in ChargingStation security info).
 */
export class SignedMeterValueType {
  @IsString()
  signedMeterData: string;

  @IsString()
  signingMethod: string;

  @IsString()
  encodingMethod: string;

  @IsOptional()
  @IsString()
  publicKey?: string;
}
