// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export interface TransactionCommandAvailability {
  canStart: boolean;
  canStop: boolean;
}

export interface TransactionCommandAvailabilityInput {
  transactions?: unknown[] | null;
  evses?: unknown[] | null;
}

export function getTransactionCommandAvailability(
  station: TransactionCommandAvailabilityInput,
): TransactionCommandAvailability {
  const activeTransactionCount = station.transactions?.length ?? 0;
  const evseCount = station.evses?.length ?? 0;

  return {
    canStart: evseCount === 0 || activeTransactionCount < evseCount,
    canStop: activeTransactionCount > 0,
  };
}
