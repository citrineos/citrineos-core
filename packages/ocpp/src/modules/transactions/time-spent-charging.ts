// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { MeterValueUtils } from '@citrineos/base';
import { ChargingStateEnum, type MeterValueDto } from '@citrineos/types';

/**
 * timeSpentCharging is "the total time that energy flowed from EVSE to EV
 * during the transaction (in seconds)", and is smaller than or
 * equal to the transaction's own duration.
 */

export interface ChargingTimelineEvent {
  timestamp: string;
  transactionInfo?: { chargingState?: string | null } | null;
  meterValue?: readonly MeterValueDto[] | null;
}

/**
 * Sum the intervals the transaction spent in `Charging` state.
 */
export function chargingSecondsFromChargingStates(
  events: readonly ChargingTimelineEvent[],
): number | undefined {
  const timeline = events
    .map((event) => ({
      at: Date.parse(event.timestamp),
      chargingState: event.transactionInfo?.chargingState,
    }))
    .filter((entry) => Number.isFinite(entry.at))
    .sort((a, b) => a.at - b.at);

  if (!timeline.some((entry) => entry.chargingState != null)) {
    return undefined;
  }

  let seconds = 0;
  let stateInEffect: string | null = null;
  let stateSince: number | undefined;

  for (const entry of timeline) {
    // The interval that just closed belongs to the state that was in effect when it opened.
    if (stateInEffect === ChargingStateEnum.Charging && stateSince !== undefined) {
      seconds += Math.max(0, (entry.at - stateSince) / 1000);
    }
    if (entry.chargingState != null) {
      stateInEffect = entry.chargingState;
    }
    stateSince = entry.at;
  }

  return seconds;
}

/**
 * Sum the intervals over which the cumulative energy register rose.
 */
export function chargingSecondsFromMeterValues(
  meterValues: readonly MeterValueDto[],
): number | undefined {
  const readings = meterValues
    .map((meterValue) => ({
      at: Date.parse(meterValue.timestamp),
      kwh: MeterValueUtils.energyRegisterKwh(meterValue.sampledValue),
    }))
    .filter((reading): reading is { at: number; kwh: number } => {
      return Number.isFinite(reading.at) && reading.kwh !== null;
    })
    .sort((a, b) => a.at - b.at);

  if (readings.length < 2) {
    return undefined;
  }

  let seconds = 0;
  for (let index = 1; index < readings.length; index++) {
    if (readings[index].kwh > readings[index - 1].kwh) {
      seconds += Math.max(0, (readings[index].at - readings[index - 1].at) / 1000);
    }
  }

  return seconds;
}

export function deriveTimeSpentChargingSeconds(
  events: readonly ChargingTimelineEvent[],
): number | undefined {
  const fromChargingStates = chargingSecondsFromChargingStates(events);
  if (fromChargingStates !== undefined) {
    return Math.round(fromChargingStates);
  }

  const fromMeterValues = chargingSecondsFromMeterValues(
    events.flatMap((event) => event.meterValue ?? []),
  );
  return fromMeterValues === undefined ? undefined : Math.round(fromMeterValues);
}
