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
vi.mock('../../src/services/LocationsService.js', () => ({ LocationsService: class {} }));

import { SessionMapper } from '../../src/mapper/SessionMapper.js';
import { CdrDimensionType } from '../../src/model/CdrDimensionType.js';
import type { CdrDimension } from '../../src/model/CdrDimension.js';

const TARIFF_ID = '7';

function mapper(): SessionMapper {
  return new SessionMapper(new Logger({ type: 'hidden' }), {} as never, {} as never);
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
