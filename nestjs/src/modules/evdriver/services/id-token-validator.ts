// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * OCPP 2.0.1 / 2.1 idToken format validator. Mirrors legacy
 * `core/src/util/util/validator.ts:validateIdToken`.
 *
 * Per OCPP spec, the wire format of `idToken` depends on `idTokenType`:
 *   - ISO15693          → 16 hex chars
 *   - ISO14443          → 8 or 14 hex chars
 *   - NoAuthorization   → empty string
 *   - KeyCode / Local / MacAddress / Central → identifier-string subset
 *   - eMAID             → 14-char eMI³ format (3-letter country, 4-digit alphanum, 6-digit alphanum, 1 check char)
 *   - VIN               → 17 chars [A-HJ-NPR-Z0-9]
 *
 * This is run BEFORE the authorization chain. A format-invalid token
 * gets `status=Invalid` immediately without a DB hit.
 */
export interface IdTokenValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

const HEX_RX = /^[0-9A-Fa-f]+$/;
const IDENTIFIER_RX = /^[a-zA-Z0-9*\-_=:+|@.]+$/;
const VIN_RX = /^[A-HJ-NPR-Z0-9]{17}$/;
const EMAID_RX = /^[A-Z]{3}[A-Z0-9]{4}[A-Z0-9]{6}[A-Z0-9]$/;

export function validateIdTokenFormat(
  idTokenType: string,
  idToken: string,
): IdTokenValidationResult {
  switch (idTokenType) {
    case 'ISO15693':
      return idToken.length === 16 && HEX_RX.test(idToken)
        ? { isValid: true }
        : {
            isValid: false,
            errorMessage: 'ISO15693 tokens must be exactly 16 hexadecimal characters',
          };

    case 'ISO14443':
      return (idToken.length === 8 || idToken.length === 14) && HEX_RX.test(idToken)
        ? { isValid: true }
        : {
            isValid: false,
            errorMessage: 'ISO14443 tokens must be 8 or 14 hexadecimal characters',
          };

    case 'NoAuthorization':
      return !idToken || idToken.length === 0
        ? { isValid: true }
        : { isValid: false, errorMessage: 'NoAuthorization tokens must be empty' };

    case 'KeyCode':
    case 'Local':
    case 'MacAddress':
    case 'Central':
      return idToken && IDENTIFIER_RX.test(idToken)
        ? { isValid: true }
        : {
            isValid: false,
            errorMessage: `${idTokenType} tokens must contain only letters, numbers, and: * - _ = : + | @ .`,
          };

    case 'eMAID':
      return idToken && EMAID_RX.test(idToken)
        ? { isValid: true }
        : {
            isValid: false,
            errorMessage: 'eMAID tokens must follow eMI³ 14-char format',
          };

    case 'VIN':
      return idToken && VIN_RX.test(idToken)
        ? { isValid: true }
        : {
            isValid: false,
            errorMessage: 'VIN tokens must be 17 chars [A-HJ-NPR-Z0-9]',
          };

    default:
      // Unknown idTokenType — pass through; the authorization chain
      // will reject Unknown types via the AuthorizationStatus.Unknown path.
      return { isValid: true };
  }
}
