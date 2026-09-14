// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
  getTransactionCommandAvailability,
  type TransactionCommandAvailabilityInput,
} from './transaction-command-availability';

const aStation = (evseCount: number, activeTransactionCount: number) =>
  ({
    evses: Array.from({ length: evseCount }, (_, i) => ({ id: i + 1 })),
    transactions: Array.from({ length: activeTransactionCount }, (_, i) => ({
      transactionId: `tx-${i + 1}`,
    })),
  }) satisfies TransactionCommandAvailabilityInput;

describe('getTransactionCommandAvailability', () => {
  describe('single-EVSE Charging Station', () => {
    it('should offer Start and not Stop when the EVSE is idle', () => {
      const availability = getTransactionCommandAvailability(aStation(1, 0));

      expect(availability).toEqual({ canStart: true, canStop: false });
    });

    it('should offer Stop and not Start when the EVSE is charging', () => {
      const availability = getTransactionCommandAvailability(aStation(1, 1));

      expect(availability).toEqual({ canStart: false, canStop: true });
    });
  });

  describe('multi-EVSE Charging Station', () => {
    it('should offer both Start and Stop when one of two EVSEs is charging', () => {
      const availability = getTransactionCommandAvailability(aStation(2, 1));

      expect(availability).toEqual({ canStart: true, canStop: true });
    });

    it('should offer Stop and not Start when every EVSE is charging', () => {
      const availability = getTransactionCommandAvailability(aStation(2, 2));

      expect(availability).toEqual({ canStart: false, canStop: true });
    });

    it('should offer Start and not Stop when no EVSE is charging', () => {
      const availability = getTransactionCommandAvailability(aStation(2, 0));

      expect(availability).toEqual({ canStart: true, canStop: false });
    });

    it('should still offer Start on a large station with a single busy EVSE', () => {
      const availability = getTransactionCommandAvailability(aStation(8, 1));

      expect(availability).toEqual({ canStart: true, canStop: true });
    });
  });

  describe('relations the caller did not select', () => {
    it('should offer Start when the evses relation is absent', () => {
      const availability = getTransactionCommandAvailability({ transactions: [] });

      expect(availability).toEqual({ canStart: true, canStop: false });
    });

    it('should offer Start when the evses relation is absent but a transaction is active', () => {
      const availability = getTransactionCommandAvailability({
        transactions: [{ transactionId: 'tx-1' }],
      });

      expect(availability).toEqual({ canStart: true, canStop: true });
    });

    it('should offer Start and not Stop when neither relation is selected', () => {
      const availability = getTransactionCommandAvailability({});

      expect(availability).toEqual({ canStart: true, canStop: false });
    });

    it('should treat null relations the same as absent ones', () => {
      const availability = getTransactionCommandAvailability({ evses: null, transactions: null });

      expect(availability).toEqual({ canStart: true, canStop: false });
    });

    it('should treat an empty evses array as an unknown EVSE count and offer Start', () => {
      const availability = getTransactionCommandAvailability({ evses: [], transactions: [] });

      expect(availability).toEqual({ canStart: true, canStop: false });
    });
  });

  it('should not offer Start when active transactions outnumber the known EVSEs', () => {
    const availability = getTransactionCommandAvailability(aStation(1, 2));

    expect(availability).toEqual({ canStart: false, canStop: true });
  });
});
