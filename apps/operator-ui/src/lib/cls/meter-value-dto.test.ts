// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { MeasurandEnum, OCPP2_0_1, type MeterValueDto, type SampledValue } from '@citrineos/types';
import { getTimestampToMeasurandArray, normalizeValue } from './meter-value-dto';

const anySampled = (overrides: Record<string, unknown>): SampledValue =>
  ({ value: 1000, ...overrides }) as unknown as SampledValue;

const aMeterValue = (timestamp: string, sampledValue: unknown): MeterValueDto =>
  ({ timestamp, sampledValue }) as unknown as MeterValueDto;

const validContexts = new Set([OCPP2_0_1.ReadingContextEnumType.Sample_Periodic]);

describe('normalizeValue', () => {
  it('scales an energy sample without a unit from Wh to kWh', () => {
    expect(normalizeValue(anySampled({ measurand: 'Energy.Active.Import.Register' }))).toBe('1.00');
  });

  it('scales a sample with neither unit nor measurand as the default energy register', () => {
    expect(normalizeValue(anySampled({}))).toBe('1.00');
  });

  it('scales a power sample without a unit from W to kW', () => {
    expect(normalizeValue(anySampled({ measurand: 'Power.Active.Import' }))).toBe('1.00');
  });

  it.each(['Voltage', 'Current.Import', 'Frequency', 'Power.Factor', 'SoC'])(
    'leaves a %s sample without a unit unscaled',
    (measurand) => {
      expect(normalizeValue(anySampled({ measurand, value: 230 }))).toBe('230.00');
    },
  );

  it('still honours an explicit unit and multiplier', () => {
    expect(
      normalizeValue(
        anySampled({ measurand: 'Voltage', value: 230, unitOfMeasure: { unit: 'W' } }),
      ),
    ).toBe('0.23');
    expect(normalizeValue(anySampled({ value: 80, unitOfMeasure: { unit: 'Percent' } }))).toBe(
      '0.80',
    );
  });
});

describe('getTimestampToMeasurandArray', () => {
  it('skips a meter value that has no sampled values instead of throwing', () => {
    const values = [
      aMeterValue('2026-01-01T00:00:00Z', []),
      aMeterValue('2026-01-01T00:00:10Z', undefined),
      aMeterValue('2026-01-01T00:00:20Z', [
        { value: 230, measurand: MeasurandEnum.Voltage, phase: null },
      ]),
    ];

    expect(() =>
      getTimestampToMeasurandArray(values, MeasurandEnum.Voltage, validContexts),
    ).not.toThrow();
    expect(getTimestampToMeasurandArray(values, MeasurandEnum.Voltage, validContexts)).toEqual([
      [20, '230.00'],
    ]);
  });
});
