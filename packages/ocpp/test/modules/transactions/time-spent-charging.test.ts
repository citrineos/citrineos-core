// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { MeterValueDto } from '@citrineos/types';
import { describe, expect, it } from 'vitest';

import type { ChargingTimelineEvent } from '@modules/transactions/time-spent-charging.js';
import {
  chargingSecondsFromChargingStates,
  chargingSecondsFromMeterValues,
  deriveTimeSpentChargingSeconds,
} from '@modules/transactions/time-spent-charging.js';

const T = (minutes: number) => new Date(Date.UTC(2026, 7, 20, 10, minutes)).toISOString();

function anEvent(minutes: number, chargingState?: string): ChargingTimelineEvent {
  return {
    timestamp: T(minutes),
    transactionInfo: chargingState === undefined ? {} : { chargingState },
  };
}

/** A meter value whose cumulative import register reads `wh` watt-hours. */
function aReading(minutes: number, wh: number): MeterValueDto {
  return {
    timestamp: T(minutes),
    sampledValue: [
      {
        value: wh,
        measurand: 'Energy.Active.Import.Register',
        unitOfMeasure: { unit: 'Wh' },
      },
    ],
  } as unknown as MeterValueDto;
}

describe('chargingSecondsFromChargingStates', () => {
  it('sums only the intervals that opened in Charging', () => {
    // Charging 0-30, suspended 30-60: half an hour of charging.
    const seconds = chargingSecondsFromChargingStates([
      anEvent(0, 'Charging'),
      anEvent(30, 'SuspendedEV'),
      anEvent(60, 'SuspendedEV'),
    ]);

    expect(seconds).toBe(1800);
  });

  it.each(['EVConnected', 'SuspendedEV', 'SuspendedEVSE', 'Idle'])(
    'does not count %s as charging - energy is not flowing in it',
    (state) => {
      expect(chargingSecondsFromChargingStates([anEvent(0, state), anEvent(60, state)])).toBe(0);
    },
  );

  it('keeps the last reported state in effect across events that omit it', () => {
    // Charging is reported once and never contradicted, so all 60 minutes count.
    const seconds = chargingSecondsFromChargingStates([
      anEvent(0, 'Charging'),
      anEvent(30),
      anEvent(60),
    ]);

    expect(seconds).toBe(3600);
  });

  it('is undefined when no event ever reported a chargingState', () => {
    expect(chargingSecondsFromChargingStates([anEvent(0), anEvent(60)])).toBeUndefined();
  });

  it('is zero - not undefined - when the state was reported but never Charging', () => {
    // A real answer: the station does report state, and it says nothing charged.
    expect(chargingSecondsFromChargingStates([anEvent(0, 'Idle'), anEvent(60, 'Idle')])).toBe(0);
  });

  it('orders events by timestamp rather than trusting arrival order', () => {
    const seconds = chargingSecondsFromChargingStates([
      anEvent(60, 'SuspendedEV'),
      anEvent(0, 'Charging'),
      anEvent(30, 'SuspendedEV'),
    ]);

    expect(seconds).toBe(1800);
  });

  it('never subtracts time when a station clock steps backwards', () => {
    const seconds = chargingSecondsFromChargingStates([
      { timestamp: T(0), transactionInfo: { chargingState: 'Charging' } },
      { timestamp: 'not-a-date', transactionInfo: { chargingState: 'Charging' } },
      anEvent(30, 'SuspendedEV'),
    ]);

    expect(seconds).toBe(1800);
  });
});

describe('chargingSecondsFromMeterValues', () => {
  it('sums the intervals over which the register rose', () => {
    const seconds = chargingSecondsFromMeterValues([
      aReading(0, 0),
      aReading(30, 5000),
      aReading(60, 5000),
    ]);

    expect(seconds).toBe(1800);
  });

  it('counts nothing while the register stays flat', () => {
    expect(chargingSecondsFromMeterValues([aReading(0, 5000), aReading(60, 5000)])).toBe(0);
  });

  it('is undefined below two readings, which span no interval', () => {
    expect(chargingSecondsFromMeterValues([])).toBeUndefined();
    expect(chargingSecondsFromMeterValues([aReading(0, 0)])).toBeUndefined();
  });

  it('ignores a reading with no usable register value', () => {
    const noRegister = {
      timestamp: T(30),
      sampledValue: [{ value: 42, measurand: 'SoC' }],
    } as unknown as MeterValueDto;

    expect(chargingSecondsFromMeterValues([aReading(0, 0), noRegister, aReading(60, 5000)])).toBe(
      3600,
    );
  });
});

describe('deriveTimeSpentChargingSeconds', () => {
  it('prefers the chargingState timeline over the energy register', () => {
    // The states say 30 minutes; the register would say 60. A is the better source.
    const events: ChargingTimelineEvent[] = [
      { ...anEvent(0, 'Charging'), meterValue: [aReading(0, 0)] },
      { ...anEvent(30, 'SuspendedEV'), meterValue: [aReading(30, 5000)] },
      { ...anEvent(60, 'SuspendedEV'), meterValue: [aReading(60, 9000)] },
    ];

    expect(deriveTimeSpentChargingSeconds(events)).toBe(1800);
  });

  it('falls back to the register when no chargingState is reported anywhere', () => {
    const events: ChargingTimelineEvent[] = [
      { ...anEvent(0), meterValue: [aReading(0, 0)] },
      { ...anEvent(30), meterValue: [aReading(30, 5000)] },
      { ...anEvent(60), meterValue: [aReading(60, 5000)] },
    ];

    expect(deriveTimeSpentChargingSeconds(events)).toBe(1800);
  });

  it('is undefined when neither source can answer', () => {
    expect(deriveTimeSpentChargingSeconds([anEvent(0), anEvent(60)])).toBeUndefined();
  });

  it('rounds to whole seconds for the bigint column', () => {
    const events: ChargingTimelineEvent[] = [
      { timestamp: '2026-08-20T10:00:00.000Z', transactionInfo: { chargingState: 'Charging' } },
      { timestamp: '2026-08-20T10:00:01.400Z', transactionInfo: { chargingState: 'Idle' } },
    ];

    expect(deriveTimeSpentChargingSeconds(events)).toBe(1);
  });
});
