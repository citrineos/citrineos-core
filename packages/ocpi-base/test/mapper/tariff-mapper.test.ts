// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { TariffDto } from '@citrineos/types';
import { describe, expect, it } from 'vitest';
import { TariffDimensionType } from '../../src/model/tariff-dimension-type.js';
import type { TariffElement } from '../../src/model/tariff-element.js';
import { TariffType } from '../../src/model/tariff-type.js';
import { TariffMapper } from '../../src/mapper/tariff-mapper.js';

const UPDATED_AT = new Date('2026-08-20T11:00:00Z');

function aCoreTariff(overrides: Partial<TariffDto> = {}): Partial<TariffDto> {
  return {
    id: 42,
    currency: 'EUR',
    pricePerKwh: 0.3,
    tenant: { countryCode: 'DE', partyId: 'CPO' },
    updatedAt: UPDATED_AT,
    ...overrides,
  } as Partial<TariffDto>;
}

// mapTariffElementToCoreTariff is private and not wired up yet (see the TODO in
// TariffMapper); exercised through index access to pin the inverse mapping down.
function toCoreTariff(elements: TariffElement[]): Partial<TariffDto> {
  return new TariffMapper()['mapTariffElementToCoreTariff'](elements);
}

describe('TariffMapper.map', () => {
  it('maps the core tariff onto the OCPI DTO', () => {
    const dto = TariffMapper.map(aCoreTariff());

    expect(dto.id).toBe('42');
    expect(dto.country_code).toBe('DE');
    expect(dto.party_id).toBe('CPO');
    expect(dto.currency).toBe('EUR');
    expect(dto.type).toBe(TariffType.AD_HOC_PAYMENT);
    expect(dto.last_updated).toEqual(UPDATED_AT);
    expect(dto.elements).toHaveLength(1);
  });

  it('leaves the unmapped OCPI optionals undefined', () => {
    const dto = TariffMapper.map(aCoreTariff());

    expect(dto.tariff_alt_url).toBeUndefined();
    expect(dto.min_price).toBeUndefined();
    expect(dto.max_price).toBeUndefined();
    expect(dto.energy_mix).toBeUndefined();
    expect(dto.start_date_time).toBeUndefined();
    expect(dto.end_date_time).toBeUndefined();
  });

  it('emits a lone ENERGY component for an energy-only tariff', () => {
    const dto = TariffMapper.map(aCoreTariff({ taxRate: 19 }));

    expect(dto.elements[0].price_components).toEqual([
      { type: TariffDimensionType.ENERGY, price: 0.3, vat: 19, step_size: 1 },
    ]);
    expect(dto.elements[0].restrictions).toBeUndefined();
  });

  it('converts pricePerMin to an hourly TIME price', () => {
    // OCPI 2.2.1: a TIME component's price is per hour; core stores per minute.
    const dto = TariffMapper.map(aCoreTariff({ pricePerMin: 0.25 }));

    const time = dto.elements[0].price_components.find(
      (pc) => pc.type === TariffDimensionType.TIME,
    );
    expect(time).toEqual({
      type: TariffDimensionType.TIME,
      price: 15,
      vat: undefined,
      step_size: 1,
    });
  });

  it('orders components ENERGY, TIME, FLAT when all prices are set', () => {
    const dto = TariffMapper.map(
      aCoreTariff({ pricePerMin: 0.25, pricePerSession: 2.5, taxRate: 19 }),
    );

    expect(dto.elements[0].price_components).toEqual([
      { type: TariffDimensionType.ENERGY, price: 0.3, vat: 19, step_size: 1 },
      { type: TariffDimensionType.TIME, price: 15, vat: 19, step_size: 1 },
      { type: TariffDimensionType.FLAT, price: 2.5, vat: 19, step_size: 1 },
    ]);
  });

  it('leaves vat off every component when taxRate is absent', () => {
    const dto = TariffMapper.map(aCoreTariff({ pricePerMin: 0.25, pricePerSession: 2.5 }));

    for (const pc of dto.elements[0].price_components) {
      expect(pc.vat).toBeUndefined();
    }
  });

  it('drops zero-priced TIME and FLAT components', () => {
    const dto = TariffMapper.map(aCoreTariff({ pricePerMin: 0, pricePerSession: 0 }));

    expect(dto.elements[0].price_components.map((pc) => pc.type)).toEqual([
      TariffDimensionType.ENERGY,
    ]);
  });
});

describe('TariffMapper.mapTariffElementToCoreTariff', () => {
  it('inverts an OCPI element back to core prices', () => {
    const core = toCoreTariff([
      {
        price_components: [
          { type: TariffDimensionType.ENERGY, price: 0.3, vat: 19, step_size: 1 },
          { type: TariffDimensionType.TIME, price: 15, vat: 19, step_size: 1 },
          { type: TariffDimensionType.FLAT, price: 2.5, vat: 19, step_size: 1 },
        ],
      },
    ]);

    expect(core).toEqual({
      pricePerKwh: 0.3,
      pricePerMin: 0.25,
      pricePerSession: 2.5,
      taxRate: 19,
    });
  });

  it('defaults missing dimensions and vat to zero', () => {
    const core = toCoreTariff([
      {
        price_components: [{ type: TariffDimensionType.ENERGY, price: 0.3, step_size: 1 }],
      },
    ]);

    expect(core).toEqual({ pricePerKwh: 0.3, pricePerMin: 0, pricePerSession: 0, taxRate: 0 });
  });

  it('returns all zeros for an element without price_components', () => {
    const core = toCoreTariff([{ price_components: undefined } as unknown as TariffElement]);

    expect(core).toEqual({ pricePerKwh: 0, pricePerMin: 0, pricePerSession: 0, taxRate: 0 });
  });

  it('takes taxRate from the first component carrying a vat', () => {
    const core = toCoreTariff([
      {
        price_components: [
          { type: TariffDimensionType.ENERGY, price: 0.3, step_size: 1 },
          { type: TariffDimensionType.FLAT, price: 2.5, vat: 20, step_size: 1 },
        ],
      },
    ]);

    expect(core.taxRate).toBe(20);
  });
});
