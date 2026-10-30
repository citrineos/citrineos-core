// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { MeterValueDto } from '@citrineos/types';

/** Seconds between the transaction start and the newest meter value; 1.6 has no reported value. */
export function elapsedSecondsSinceStart(
  startTime: string | undefined,
  meterValues: MeterValueDto[],
): number | undefined {
  if (!startTime || meterValues.length === 0) {
    return undefined;
  }

  const startTimestamp = new Date(startTime).getTime();
  const latestMeterValueTimestamp = Math.max(
    ...meterValues.map((meterValue) => new Date(meterValue.timestamp).getTime()),
  );
  if (!Number.isFinite(startTimestamp) || !Number.isFinite(latestMeterValueTimestamp)) {
    return undefined;
  }

  return Math.max(0, Math.floor((latestMeterValueTimestamp - startTimestamp) / 1000));
}

export function requireAuthorizationId(id: number | undefined, what: string): number {
  if (id === undefined) {
    throw new Error(`${what} was persisted without an id`);
  }
  return id;
}

/**
 * Avoid to overwrite timeSpentCharging to null
 */
export function transactionInfoForRow<T extends { timeSpentCharging?: number | null }>(
  transactionInfo: T,
): T | Omit<T, 'timeSpentCharging'> {
  if (transactionInfo.timeSpentCharging != null) {
    return transactionInfo;
  }
  const { timeSpentCharging: _unreported, ...rest } = transactionInfo;
  return rest;
}
