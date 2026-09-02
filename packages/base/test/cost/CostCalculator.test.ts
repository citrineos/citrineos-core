// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import {
  buildPrice,
  baseCalculateEnergyCost,
  baseCalculateFixedCost,
  baseCalculateTimeCost,
  baseCalculateTotalCost,
  sumPrices,
} from '../../src/cost/CostCalculator.js';

const CURRENCY = 'EUR';

describe('CostCalculator', () => {
  describe('component prices', () => {
    it('computes energy cost as feePerKwh * totalKwh, rounded down', () => {
      // 20.999 * 0.301 = 6.320699... -> 6.32
      expect(baseCalculateEnergyCost(20.999, 0.301, CURRENCY)).toEqual({ excl_vat: 6.32 });
    });

    it('computes time cost as feePerMinute * totalMinutes', () => {
      expect(baseCalculateTimeCost(90, 0.05, CURRENCY)).toEqual({ excl_vat: 4.5 });
    });

    it('returns the flat fee as the fixed cost', () => {
      expect(baseCalculateFixedCost(2.5, CURRENCY)).toEqual({ excl_vat: 2.5 });
    });

    it('applies taxRate to a component to produce incl_vat', () => {
      expect(baseCalculateEnergyCost(10, 1, CURRENCY, 19)).toEqual({
        excl_vat: 10,
        incl_vat: 11.9,
      });
    });

    it('omits a component when its fee is null (dimension not configured)', () => {
      expect(baseCalculateEnergyCost(20, null, CURRENCY)).toBeUndefined();
      expect(baseCalculateTimeCost(90, null, CURRENCY)).toBeUndefined();
      expect(baseCalculateFixedCost(null, CURRENCY)).toBeUndefined();
    });

    it('keeps a zero-valued component when its fee is 0 (configured, zero cost)', () => {
      expect(baseCalculateEnergyCost(20, 0, CURRENCY)).toEqual({ excl_vat: 0 });
      expect(baseCalculateTimeCost(90, 0, CURRENCY)).toEqual({ excl_vat: 0 });
      expect(baseCalculateFixedCost(0, CURRENCY)).toEqual({ excl_vat: 0 });
    });
  });

  describe('buildPrice', () => {
    it('rounds the excl_vat amount down to the currency scale', () => {
      // 20.999 * 0.301 = 6.320699... -> 6.32
      expect(buildPrice(20.999 * 0.301, CURRENCY)).toEqual({ excl_vat: 6.32 });
    });

    it('adds incl_vat when a taxRate is provided', () => {
      expect(buildPrice(10, CURRENCY, 19)).toEqual({ excl_vat: 10, incl_vat: 11.9 });
    });

    it('returns undefined for a null/undefined amount', () => {
      expect(buildPrice(undefined, CURRENCY)).toBeUndefined();
    });

    it('builds a zero price for a 0 amount', () => {
      expect(buildPrice(0, CURRENCY)).toEqual({ excl_vat: 0 });
    });
  });

  describe('sumPrices', () => {
    it('sums defined component prices', () => {
      expect(sumPrices(CURRENCY, [{ excl_vat: 1 }, { excl_vat: 6 }, { excl_vat: 4.5 }])).toEqual({
        excl_vat: 11.5,
      });
    });

    it('ignores undefined components', () => {
      expect(sumPrices(CURRENCY, [undefined, { excl_vat: 3 }])).toEqual({ excl_vat: 3 });
    });

    it('returns a zero price when there are no components', () => {
      expect(sumPrices(CURRENCY, [])).toEqual({ excl_vat: 0 });
    });

    it('sums incl_vat when any component carries it', () => {
      expect(
        sumPrices(CURRENCY, [
          { excl_vat: 3, incl_vat: 3.6 },
          { excl_vat: 1, incl_vat: 1.2 },
        ]),
      ).toEqual({ excl_vat: 4, incl_vat: 4.8 });
    });
  });

  describe('baseCalculateTotalCost', () => {
    it('is the sum of fixed + energy + time cost, not energy alone', () => {
      // fixed: 1, energy: 20 * 0.3 = 6, time: 90 * 0.05 = 4.5 => 11.5
      const total = baseCalculateTotalCost(20, 90, 1, 0.3, 0.05, CURRENCY);
      expect(total).toEqual({ excl_vat: 11.5 });
    });

    it('rounds each component down to the currency scale', () => {
      // energy only: 20.999 * 0.301 = 6.320699... -> 6.32
      const total = baseCalculateTotalCost(20.999, 0, null, 0.301, null, CURRENCY);
      expect(total).toEqual({ excl_vat: 6.32 });
    });

    it('sums incl_vat across components when a taxRate is set', () => {
      // energy: 3, fixed: 1 => excl_vat 4, incl_vat 4.8
      const total = baseCalculateTotalCost(10, 0, 1, 0.3, null, CURRENCY, 20);
      expect(total).toEqual({ excl_vat: 4, incl_vat: 4.8 });
    });

    it('omits dimensions with null fees but keeps zero-fee dimensions', () => {
      // per-session fee null -> omitted; per-kWh fee 0 -> included as 0
      const total = baseCalculateTotalCost(20, 0, null, 0, null, CURRENCY);
      expect(total).toEqual({ excl_vat: 0 });
    });
  });
});
