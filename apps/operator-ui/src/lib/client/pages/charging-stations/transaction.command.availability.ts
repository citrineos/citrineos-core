// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Which of the remote start / remote stop commands a Charging Station can currently accept.
 *
 * A Charging Station may expose several EVSEs, each able to run its own transaction, so the two
 * commands are not mutually exclusive: a station with one EVSE charging and another free can be
 * both started and stopped. Deciding on the presence of any active transaction hides Start for the
 * whole station as soon as a single EVSE is busy.
 */
export interface TransactionCommandAvailability {
  canStart: boolean;
  canStop: boolean;
}

/**
 * Structural rather than a Pick of a station DTO: the callers pass ChargingStationDto and
 * ChargingStationDetailsDto, which disagree on whether these relations are optional, and only the
 * counts are needed here.
 */
export interface TransactionCommandAvailabilityInput {
  transactions?: unknown[] | null;
  evses?: unknown[] | null;
}

export function getTransactionCommandAvailability(
  station: TransactionCommandAvailabilityInput,
): TransactionCommandAvailability {
  // The station queries already constrain this relation to `isActive: { _eq: true }`.
  const activeTransactionCount = station.transactions?.length ?? 0;
  const evseCount = station.evses?.length ?? 0;

  return {
    // An unknown EVSE count means the caller did not select the relation, so fall back to offering
    // Start rather than hiding a command the station can very likely still accept.
    canStart: evseCount === 0 || activeTransactionCount < evseCount,
    canStop: activeTransactionCount > 0,
  };
}
