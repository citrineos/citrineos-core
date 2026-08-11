// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_1 } from '@citrineos/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MeterValueMapper } from '@dal/layers/sequelize/mapper/2/MeterValueMapper.js';
import { MeterValueUtils } from '@base-util/MeterValueUtils.js';

describe('MeterValueMapper (OCPP 2 ingestion)', () => {
  // console.warn is emitted when an unrepresentable measurand is dropped; silence it in tests.
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fromMeasurandEnumType', () => {
    it.each([
      [OCPP2_1.MeasurandEnumType.Energy_Active_Import_Register, 'Energy.Active.Import.Register'],
      [OCPP2_1.MeasurandEnumType.Current_Import, 'Current.Import'],
      [OCPP2_1.MeasurandEnumType.Voltage, 'Voltage'],
      [OCPP2_1.MeasurandEnumType.SoC, 'SoC'],
    ] as const)('maps known measurand %s -> %s', (input, expected) => {
      expect(MeterValueMapper.fromMeasurandEnumType(input)).toBe(expected);
    });

    it('returns undefined for null/undefined (absent measurand)', () => {
      expect(MeterValueMapper.fromMeasurandEnumType(null)).toBeUndefined();
      expect(MeterValueMapper.fromMeasurandEnumType(undefined)).toBeUndefined();
    });

    // Regression: these used to fall through to Energy.Active.Import.Register, corrupting the
    // stored measurand and the transaction kWh.
    it.each([
      OCPP2_1.MeasurandEnumType.Voltage_Minimum,
      OCPP2_1.MeasurandEnumType.Power_Active_Setpoint,
      OCPP2_1.MeasurandEnumType.Display_PresentSOC,
      OCPP2_1.MeasurandEnumType.EnergyRequest_Target,
    ])('returns undefined for unrepresentable 2.1 measurand %s', (input) => {
      expect(MeterValueMapper.fromMeasurandEnumType(input)).toBeUndefined();
    });
  });

  describe('fromSampledValueTypes', () => {
    it('drops a sampled value whose measurand is present but unrepresentable, keeps the rest', () => {
      const result = MeterValueMapper.fromSampledValueTypes([
        { value: 200, measurand: OCPP2_1.MeasurandEnumType.Energy_Active_Import_Register },
        { value: 400, measurand: OCPP2_1.MeasurandEnumType.Voltage_Minimum },
      ] as any);

      expect(result).toHaveLength(1);
      expect(result[0].measurand).toBe('Energy.Active.Import.Register');
      expect(result[0].value).toBe(200);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('keeps a genuinely absent measurand (spec default applies downstream)', () => {
      const result = MeterValueMapper.fromSampledValueTypes([{ value: 100 }] as any);

      expect(result).toHaveLength(1);
      expect(result[0].measurand).toBeUndefined();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('fromMeterValueType', () => {
    it('returns undefined when every sampled value is an unrepresentable measurand', () => {
      const result = MeterValueMapper.fromMeterValueType({
        timestamp: '2025-05-29T12:01:00Z',
        sampledValue: [{ value: 400, measurand: OCPP2_1.MeasurandEnumType.Voltage_Minimum }],
      } as any);

      expect(result).toBeUndefined();
    });

    it('keeps the meter value when at least one sampled value survives', () => {
      const result = MeterValueMapper.fromMeterValueType({
        timestamp: '2025-05-29T12:01:00Z',
        sampledValue: [
          { value: 100, measurand: OCPP2_1.MeasurandEnumType.Energy_Active_Import_Register },
          { value: 400, measurand: OCPP2_1.MeasurandEnumType.Voltage_Minimum },
        ],
      } as any);

      expect(result).toBeDefined();
      expect(result!.sampledValue).toHaveLength(1);
      expect(result!.sampledValue[0].measurand).toBe('Energy.Active.Import.Register');
    });
  });

  // The point of the whole fix: an unrepresentable measurand must not poison totalKwh.
  describe('totalKwh is not poisoned by an unrepresentable measurand', () => {
    it('computes kWh from real register readings only, ignoring a dropped Voltage.Minimum', () => {
      const raw = [
        {
          timestamp: '2025-05-29T12:01:00Z',
          sampledValue: [
            {
              value: 100,
              measurand: OCPP2_1.MeasurandEnumType.Energy_Active_Import_Register,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
          ],
        },
        {
          timestamp: '2025-05-29T12:02:00Z',
          sampledValue: [
            {
              value: 200,
              measurand: OCPP2_1.MeasurandEnumType.Energy_Active_Import_Register,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
            // Would previously be relabeled as the register (and, with unit V, crash normalizeToKwh).
            {
              value: 400,
              measurand: OCPP2_1.MeasurandEnumType.Voltage_Minimum,
              unitOfMeasure: { unit: 'V', multiplier: 0 },
            },
          ],
        },
      ];

      const meterValues = raw
        .map((mv) => MeterValueMapper.fromMeterValueType(mv as any))
        .filter((mv) => mv !== undefined);

      expect(() => MeterValueUtils.getTotalKwh(meterValues as any, 0)).not.toThrow();
      expect(MeterValueUtils.getTotalKwh(meterValues as any, 0)).toBe(100); // 200 - 100
    });
  });
});
