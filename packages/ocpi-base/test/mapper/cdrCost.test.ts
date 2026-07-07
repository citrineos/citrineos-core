// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { TariffDto } from '@citrineos/base';
import { describe, expect, it } from 'vitest';
import { AuthMethod } from '../../src/model/AuthMethod.js';
import { SessionStatus } from '../../src/model/SessionStatus.js';
import { TokenType } from '../../src/model/TokenType.js';
import type { Session } from '../../src/model/Session.js';
import {
  calculateEnergyCost,
  calculateFixedCost,
  calculateTimeCost,
  calculateTotalCdrCost,
} from '../../src/mapper/cdrCost.js';

function aSession(overrides: Partial<Session> = {}): Session {
  return {
    country_code: 'DE',
    party_id: 'ACX',
    id: 'session-1',
    start_date_time: new Date('2026-01-01T10:00:00Z'),
    end_date_time: new Date('2026-01-01T11:30:00Z'), // 90 minutes
    kwh: 20,
    cdr_token: {
      uid: 'token-1',
      type: TokenType.RFID,
      contract_id: 'contract-1',
      country_code: 'DE',
      party_id: 'ACX',
    },
    auth_method: AuthMethod.WHITELIST,
    authorization_reference: null,
    location_id: 'location-1',
    evse_uid: 'evse-1',
    connector_id: 'connector-1',
    meter_id: null,
    currency: 'EUR',
    charging_periods: [],
    status: SessionStatus.COMPLETED,
    last_updated: new Date('2026-01-01T11:30:00Z'),
    ...overrides,
  };
}

function aTariff(overrides: Partial<TariffDto> = {}): TariffDto {
  return {
    currency: 'EUR',
    pricePerKwh: 0.3,
    ...overrides,
  } as TariffDto;
}

describe('cdrCost', () => {
  it('computes energy cost from kWh and pricePerKwh, rounded down to cents', () => {
    const price = calculateEnergyCost(aSession({ kwh: 20.999 }), aTariff({ pricePerKwh: 0.301 }));
    expect(price).toEqual({ excl_vat: 6.32 }); // 20.999 * 0.301 = 6.320699...
  });

  it('applies taxRate to produce incl_vat alongside excl_vat', () => {
    const price = calculateEnergyCost(
      aSession({ kwh: 10 }),
      aTariff({ pricePerKwh: 1, taxRate: 19 }),
    );
    expect(price).toEqual({ excl_vat: 10, incl_vat: 11.9 });
  });

  it('omits fixed cost when the tariff has no pricePerSession', () => {
    expect(calculateFixedCost(aTariff())).toBeUndefined();
  });

  it('includes fixed cost when the tariff has a pricePerSession', () => {
    const price = calculateFixedCost(aTariff({ pricePerSession: 2.5 }));
    expect(price).toEqual({ excl_vat: 2.5 });
  });

  it('omits time cost when the tariff has no pricePerMin', () => {
    expect(calculateTimeCost(aSession(), aTariff())).toBeUndefined();
  });

  it('computes time cost from elapsed minutes and pricePerMin', () => {
    // 90 minute session (10:00 -> 11:30) at 0.05/min = 4.5
    const price = calculateTimeCost(aSession(), aTariff({ pricePerMin: 0.05 }));
    expect(price).toEqual({ excl_vat: 4.5 });
  });

  it('total cost is the sum of fixed + energy + time cost, not energy alone', () => {
    const tariff = aTariff({ pricePerKwh: 0.3, pricePerMin: 0.05, pricePerSession: 1 });
    const session = aSession({ kwh: 20 });
    const total = calculateTotalCdrCost(session, tariff);
    // fixed: 1, energy: 20 * 0.3 = 6, time: 90 * 0.05 = 4.5 => 11.5
    expect(total).toEqual({ excl_vat: 11.5 });
  });

  it('sums incl_vat across components when the tariff has a taxRate', () => {
    const tariff = aTariff({ pricePerKwh: 0.3, pricePerSession: 1, taxRate: 20 });
    const total = calculateTotalCdrCost(aSession({ kwh: 10 }), tariff);
    // energy: 3, fixed: 1 => excl_vat 4, incl_vat 4.8
    expect(total).toEqual({ excl_vat: 4, incl_vat: 4.8 });
  });
});
