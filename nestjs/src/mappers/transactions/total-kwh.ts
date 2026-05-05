// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MeterValueRow } from '@entities/meter-value.entity';
import { MeterValueType } from '@dto/shared/meter-value.dto';
import { SampledValueType } from '@dto/shared/sampled-value.dto';

/** OCPP measurand carried on a SampledValue when it's the cumulative meter register. */
const ENERGY_ACTIVE_IMPORT_REGISTER = 'Energy.Active.Import.Register';

/**
 * Compute Transaction.totalKwh as the (max − min) of `Energy.Active.Import.Register`
 * samples seen so far. Mirrors the legacy `_calculateTotalKwh` in
 * `core/src/dal/repository/Transaction.ts`.
 *
 * Why max-min rather than first-last:
 *   - The charger may emit multiple samples per timestamp envelope.
 *   - `endTime - startTime` is unreliable when transactions span boots.
 *   - The cumulative meter register is monotonic in normal operation, so
 *     max-min collapses to last-first under non-degenerate inputs but stays
 *     robust when the charger replays.
 *
 * Returns the total in kWh as a string (matches the `text` column type on
 * `Transactions.totalKwh`). Returns `null` when no register samples have
 * been seen — caller should not write the column.
 */
export const computeTotalKwh = (
  storedRows: MeterValueRow[],
  newSamples: MeterValueType[] = [],
): string | null => {
  const registers: number[] = [];
  for (const row of storedRows) {
    pushRegisters(registers, row.sampledValue as SampledValueType[] | null, row.timestamp);
  }
  for (const mv of newSamples) {
    pushRegisters(registers, mv.sampledValue, mv.timestamp);
  }
  if (registers.length === 0) return null;
  const min = Math.min(...registers);
  const max = Math.max(...registers);
  // Wh → kWh; OCPP `unit` is W·h by default for Energy.Active.Import.Register.
  return ((max - min) / 1000).toString();
};

const pushRegisters = (
  out: number[],
  samples: SampledValueType[] | null,
  _timestamp: unknown,
): void => {
  if (!samples) return;
  for (const s of samples) {
    if ((s.measurand ?? ENERGY_ACTIVE_IMPORT_REGISTER) !== ENERGY_ACTIVE_IMPORT_REGISTER) continue;
    if (typeof s.value !== 'number' || Number.isNaN(s.value)) continue;
    // Normalize unit to W·h so the max-min math is consistent.
    const value = s.unit === 'kWh' ? s.value * 1000 : s.value;
    out.push(value);
  }
};
