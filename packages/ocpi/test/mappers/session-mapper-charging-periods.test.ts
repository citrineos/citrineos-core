// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { MeterValueDto, SampledValue } from '@citrineos/types';
import { MeasurandEnum } from '@citrineos/types';
import { MeterValueUtils } from '@citrineos/base';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

// LocationsService is a typedi-decorated service sitting on an import cycle with this mapper.
// Charging period mapping never reaches it.
vi.mock('@ocpi/services/locations-service.js', () => ({ LocationsService: class {} }));

import { SessionMapper } from '@ocpi/mappers/session-mapper.js';
import { CdrDimensionType } from '@ocpi/types/cdr-dimension-type.js';
import type { CdrDimension } from '@ocpi/types/cdr-dimension.js';

const TARIFF_ID = '7';

function mapper(): SessionMapper {
  return new SessionMapper({
    logger: new Logger({ type: 'hidden' }),
    locationsService: {},
    ocpiGraphqlClient: {},
  } as never);
}

function meterValue(timestamp: string, ...sampledValue: SampledValue[]): MeterValueDto {
  return { timestamp, sampledValue } as unknown as MeterValueDto;
}

function energyRegister(value: number, unit?: string, multiplier?: number): SampledValue {
  return {
    value,
    measurand: MeasurandEnum['Energy.Active.Import.Register'],
    ...(unit !== undefined || multiplier !== undefined
      ? { unitOfMeasure: { unit, multiplier } }
      : {}),
  } as SampledValue;
}

function volumeOf(dimensions: CdrDimension[], type: CdrDimensionType): number | undefined {
  return dimensions.find((dimension) => dimension.type === type)?.volume;
}

describe('SessionMapper.getChargingPeriods energy dimensions', () => {
  it('reports ENERGY_IMPORT in kWh when the meter reports Wh', () => {
    const periods = mapper().getChargingPeriods(
      [meterValue('2026-08-20T10:00:00Z', energyRegister(5000, 'Wh'))],
      TARIFF_ID,
    );

    expect(volumeOf(periods[0].dimensions, CdrDimensionType.ENERGY_IMPORT)).toBe(5);
  });

  it('treats an absent unitOfMeasure as Wh, the OCPP default', () => {
    const periods = mapper().getChargingPeriods(
      [meterValue('2026-08-20T10:00:00Z', energyRegister(5000))],
      TARIFF_ID,
    );

    expect(volumeOf(periods[0].dimensions, CdrDimensionType.ENERGY_IMPORT)).toBe(5);
  });

  it('leaves a kWh reading alone', () => {
    const periods = mapper().getChargingPeriods(
      [meterValue('2026-08-20T10:00:00Z', energyRegister(5, 'kWh'))],
      TARIFF_ID,
    );

    expect(volumeOf(periods[0].dimensions, CdrDimensionType.ENERGY_IMPORT)).toBe(5);
  });

  it('applies the unitOfMeasure multiplier', () => {
    const periods = mapper().getChargingPeriods(
      [meterValue('2026-08-20T10:00:00Z', energyRegister(5, 'Wh', 3))],
      TARIFF_ID,
    );

    expect(volumeOf(periods[0].dimensions, CdrDimensionType.ENERGY_IMPORT)).toBe(5);
  });

  it('reports the per-period ENERGY delta in kWh', () => {
    const periods = mapper().getChargingPeriods(
      [
        meterValue('2026-08-20T10:00:00Z', energyRegister(5000, 'Wh')),
        meterValue('2026-08-20T10:30:00Z', energyRegister(12000, 'Wh')),
      ],
      TARIFF_ID,
    );

    expect(volumeOf(periods[1].dimensions, CdrDimensionType.ENERGY)).toBe(7);
  });

  it('sums to the same total energy the CDR reports', () => {
    // cdr.total_energy comes from transaction.totalKwh, which MeterValueUtils normalises. The
    // charging periods have to reconcile against it or a CDR contradicts itself.
    const meterValues = [
      meterValue('2026-08-20T10:00:00Z', energyRegister(0, 'Wh')),
      meterValue('2026-08-20T10:30:00Z', energyRegister(21500, 'Wh')),
      meterValue('2026-08-20T11:00:00Z', energyRegister(48250, 'Wh')),
    ];

    const periods = mapper().getChargingPeriods(meterValues, TARIFF_ID);
    const summed = periods.reduce(
      (total, period) => total + (volumeOf(period.dimensions, CdrDimensionType.ENERGY) ?? 0),
      0,
    );

    expect(summed).toBeCloseTo(MeterValueUtils.getTotalKwh(meterValues, 0), 6);
  });
});

describe('SessionMapper.getChargingPeriods CURRENT dimension', () => {
  it('reports the charging current of a DC session, which carries no phase', () => {
    const periods = mapper().getChargingPeriods(
      [
        meterValue('2026-08-20T10:00:00Z', {
          value: 350,
          measurand: MeasurandEnum['Current.Import'],
        } as SampledValue),
      ],
      TARIFF_ID,
    );

    expect(volumeOf(periods[0].dimensions, CdrDimensionType.CURRENT)).toBe(350);
  });

  it('does not report the neutral conductor current as the charging current', () => {
    // OCPI CURRENT is the current over all phases. Phase N is the neutral imbalance, which on a
    // balanced three-phase supply is near zero.
    const periods = mapper().getChargingPeriods(
      [
        meterValue(
          '2026-08-20T10:00:00Z',
          { value: 32, measurand: MeasurandEnum['Current.Import'], phase: 'L1' } as SampledValue,
          { value: 0.4, measurand: MeasurandEnum['Current.Import'], phase: 'N' } as SampledValue,
        ),
      ],
      TARIFF_ID,
    );

    expect(volumeOf(periods[0].dimensions, CdrDimensionType.CURRENT)).not.toBe(0.4);
  });
});

describe('SessionMapper.getChargingPeriods time dimensions', () => {
  const AT = (minutes: number) => new Date(Date.UTC(2026, 7, 20, 10, minutes)).toISOString();

  function periodsOver(
    readings: readonly [number, number][],
    sessionStartTime?: string,
  ): ReturnType<SessionMapper['getChargingPeriods']> {
    return mapper().getChargingPeriods(
      readings.map(([minutes, wh]) => meterValue(AT(minutes), energyRegister(wh, 'Wh'))),
      TARIFF_ID,
      sessionStartTime,
    );
  }

  function timeKinds(periods: ReturnType<SessionMapper['getChargingPeriods']>) {
    return periods.map((period) =>
      period.dimensions
        .filter(
          (dimension) =>
            dimension.type === CdrDimensionType.TIME ||
            dimension.type === CdrDimensionType.PARKING_TIME,
        )
        .map((dimension) => [dimension.type, dimension.volume] as const),
    );
  }

  it('gives every period exactly one of TIME or PARKING_TIME', () => {
    const kinds = timeKinds(
      periodsOver([
        [0, 0],
        [30, 5000],
        [60, 5000],
      ]),
    );

    expect(kinds.map((period) => period.length)).toEqual([1, 1, 1]);
  });

  it('reports TIME for an interval whose register rose', () => {
    const periods = periodsOver([
      [0, 0],
      [30, 5000],
    ]);

    expect(volumeOf(periods[1].dimensions, CdrDimensionType.TIME)).toBeCloseTo(0.5, 10);
    expect(volumeOf(periods[1].dimensions, CdrDimensionType.PARKING_TIME)).toBeUndefined();
  });

  it('reports PARKING_TIME for an interval whose register stayed flat', () => {
    // The car is still plugged in but no longer drawing: this must not be billed as charging.
    const periods = periodsOver([
      [0, 5000],
      [60, 5000],
    ]);

    expect(volumeOf(periods[1].dimensions, CdrDimensionType.PARKING_TIME)).toBeCloseTo(1, 10);
    expect(volumeOf(periods[1].dimensions, CdrDimensionType.TIME)).toBeUndefined();
  });

  it('makes the first period parking, since nothing precedes its reading', () => {
    const periods = periodsOver([
      [30, 0],
      [60, 5000],
    ]);

    expect(volumeOf(periods[0].dimensions, CdrDimensionType.PARKING_TIME)).toBe(0);
  });

  it('folds the wait before the first reading into the first period', () => {
    // Session opens at 10:00, first meter value at 10:30: half an hour of parking.
    const periods = periodsOver(
      [
        [30, 0],
        [60, 5000],
      ],
      AT(0),
    );

    expect(volumeOf(periods[0].dimensions, CdrDimensionType.PARKING_TIME)).toBeCloseTo(0.5, 10);
  });

  it('leaves the first period at zero when no session start is given', () => {
    const periods = periodsOver([
      [30, 0],
      [60, 5000],
    ]);

    expect(volumeOf(periods[0].dimensions, CdrDimensionType.PARKING_TIME)).toBe(0);
  });

  it("does not reorder the caller's meter values", () => {
    const readings = [
      meterValue(AT(60), energyRegister(5000, 'Wh')),
      meterValue(AT(0), energyRegister(0, 'Wh')),
    ];

    mapper().getChargingPeriods(readings, TARIFF_ID);

    expect(readings[0].timestamp).toBe(AT(60));
  });
});
