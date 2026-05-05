// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsString } from 'class-validator';

/**
 * Vendor-extension info attached to an `IdTokenType`. Lets operators
 * smuggle payment-terminal IDs, internal account numbers, or other
 * application-specific identifiers alongside the canonical token.
 *
 * @example
 * { "additionalIdToken": "PT-12345", "type": "PaymentTerminalId" }
 */
export class AdditionalInfoType {
  /**
   * The extra identifier value.
   * @example 'PT-12345'
   */
  @IsString()
  additionalIdToken: string;

  /**
   * Vendor-defined type tag for this extra identifier.
   * @example 'PaymentTerminalId'
   */
  @IsString()
  type: string;
}
