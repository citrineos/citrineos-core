// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { OCPPValidator } from '@interfaces/modules/ocpp-validator.js';

/**
 * OCPP-J 1.6 errata, "(2025-04) - MeterValues.json and StopTransaction.json incorrect spelling of
 * Celsius V2", summary:
 *
 *   1. The JSON schema StopTransaction.req is updated to also include the corrected spelling
 *      Celsius.
 *   2. Charge Point implementers are advised to remain using the not corrected version of the
 *      spelling; Celcius.
 *   3. Central System implementers are advised to use the updated JSON schema for their JSON schema
 *      validation and accept both spellings; Celsius and Celcius.
 *
 * So a CSMS has to take both, and the misspelling is the one stations are told to keep sending.
 */
const SPELLINGS = ['Celcius', 'Celsius'];

describe('OCPP 1.6 temperature unit spelling', () => {
  const validator = new OCPPValidator();

  function aSampledValue(unit: string) {
    return {
      value: '21.5',
      measurand: 'Temperature',
      unit,
    };
  }

  it.each(SPELLINGS)('accepts %s in MeterValues', (unit) => {
    const result = validator.validateOCPPRequest(
      OCPP_CallAction.MeterValues,
      {
        connectorId: 1,
        meterValue: [
          { timestamp: '2026-08-27T10:00:00.000Z', sampledValue: [aSampledValue(unit)] },
        ],
      },
      OCPPVersion.OCPP1_6,
    );

    expect(result.errors ?? []).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it.each(SPELLINGS)('accepts %s in StopTransaction transactionData', (unit) => {
    const result = validator.validateOCPPRequest(
      OCPP_CallAction.StopTransaction,
      {
        transactionId: 1,
        meterStop: 5000,
        timestamp: '2026-08-27T10:00:00.000Z',
        transactionData: [
          { timestamp: '2026-08-27T10:00:00.000Z', sampledValue: [aSampledValue(unit)] },
        ],
      },
      OCPPVersion.OCPP1_6,
    );

    expect(result.errors ?? []).toEqual([]);
    expect(result.isValid).toBe(true);
  });
});
