// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { OCPP2_0_1_CALL_SCHEMA_RECORD } from '../../index.js';
import { OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { OCPPValidator } from '@interfaces/modules/OCPPValidator.js';

/**
 * OCPP 2.0.1 types IdTokenType.idToken as identifierString[0..36]. OCPP 2.1 widened the same field
 * to identifierString[0..255]; 2.0.1 did not, and a 2.0.1 station's own schema still stops at 36.
 */
const MAX_2_0_1_ID_TOKEN = 36;

describe('OCPP 2.0.1 idToken length', () => {
  const validator = new OCPPValidator();

  function validateAuthorize(idToken: string) {
    return validator.validateOCPPRequest(
      OCPP_CallAction.Authorize,
      { idToken: { idToken, type: 'Central' } },
      OCPPVersion.OCPP2_0_1,
    );
  }

  it('accepts the longest idToken 2.0.1 allows', () => {
    expect(validateAuthorize('a'.repeat(MAX_2_0_1_ID_TOKEN)).isValid).toBe(true);
  });

  it('refuses one character more', () => {
    expect(validateAuthorize('a'.repeat(MAX_2_0_1_ID_TOKEN + 1)).isValid).toBe(false);
  });

  it('refuses an idToken of the length OCPP 2.1 allows', () => {
    expect(validateAuthorize('a'.repeat(255)).isValid).toBe(false);
  });

  // The CSMS also sends idTokens to the station, so the same bound has to hold on the messages the
  // operator API validates before forwarding.
  it.each([
    OCPP_CallAction.RequestStartTransaction,
    OCPP_CallAction.SendLocalList,
    OCPP_CallAction.ReserveNow,
    OCPP_CallAction.CustomerInformation,
    OCPP_CallAction.TransactionEvent,
  ])('declares the 2.0.1 bound in the %s schema', (action) => {
    const schema = OCPP2_0_1_CALL_SCHEMA_RECORD[action] as {
      definitions: { IdTokenType: { properties: { idToken: { maxLength: number } } } };
    };

    expect(schema.definitions.IdTokenType.properties.idToken.maxLength).toBe(MAX_2_0_1_ID_TOKEN);
  });
});
