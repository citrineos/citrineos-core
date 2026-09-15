// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPValidator } from '@citrineos/base';
import { OCPP2_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ViesVatProvider } from '@services/vat-provider/vies-vat-provider.js';
import { createTestContainer } from '@test/test-container.js';

const VAT_NUMBER = 'DE123456789';
const LONG_NAME = 'N'.repeat(60);
const LONG_ADDRESS = ['A'.repeat(120), 'B'.repeat(60), 'C'.repeat(60), `12345 ${'D'.repeat(110)}`];

describe('ViesVatProvider', () => {
  const { logger } = createTestContainer();
  let fetchMock: ReturnType<typeof vi.fn>;
  let provider: ViesVatProvider;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    provider = new ViesVatProvider({ logger });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function viesReturns(name: string, addressLines: string[]) {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          countryCode: 'DE',
          vatNumber: '123456789',
          valid: true,
          name,
          address: addressLines.join('\n'),
        }),
    } as Response);
  }

  it('returns a company the VatNumberValidationResponse schema accepts when the registry data is long', async () => {
    viesReturns(LONG_NAME, LONG_ADDRESS);

    const company = await provider.getVat(VAT_NUMBER);

    const { isValid, errors } = new OCPPValidator().validateOCPPResponse(
      OCPP_CallAction.VatNumberValidation,
      { vatNumber: VAT_NUMBER, status: OCPP2_1.GenericStatusEnumType.Accepted, company },
      OCPPVersion.OCPP2_1,
    );
    expect(errors ?? []).toEqual([]);
    expect(isValid).toBe(true);
  });

  it('keeps the start of each field that is too long', async () => {
    viesReturns(LONG_NAME, LONG_ADDRESS);

    const company = await provider.getVat(VAT_NUMBER);

    expect(company).toEqual({
      name: 'N'.repeat(50),
      address1: 'A'.repeat(100),
      address2: `${'B'.repeat(60)}, ${'C'.repeat(38)}`,
      city: 'D'.repeat(100),
      postalCode: '12345',
      country: 'DE',
    });
  });

  it('leaves fields within their limits unchanged', async () => {
    viesReturns('Example GmbH', ['Example Street 1', 'Floor 2', '12345 Example']);

    const company = await provider.getVat(VAT_NUMBER);

    expect(company).toEqual({
      name: 'Example GmbH',
      address1: 'Example Street 1',
      address2: 'Floor 2',
      city: 'Example',
      postalCode: '12345',
      country: 'DE',
    });
  });
});
