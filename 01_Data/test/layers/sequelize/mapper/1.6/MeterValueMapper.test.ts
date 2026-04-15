// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP1_6, type SampledValue, type MeterValueDto } from '@citrineos/base';
import { describe, expect, it } from 'vitest';
import { MeterValueMapper } from '../../../../../src/layers/sequelize/mapper/1.6';

describe('MeterValueMapper (OCPP 1.6)', () => {
  describe('ReadingContext conversions', () => {
    describe('toReadingContextEnumType', () => {
      it.each([
        ['Interruption.Begin', OCPP1_6.MeterValuesRequestContext.Interruption_Begin],
        ['Interruption.End', OCPP1_6.MeterValuesRequestContext.Interruption_End],
        ['Other', OCPP1_6.MeterValuesRequestContext.Other],
        ['Sample.Clock', OCPP1_6.MeterValuesRequestContext.Sample_Clock],
        ['Sample.Periodic', OCPP1_6.MeterValuesRequestContext.Sample_Periodic],
        ['Transaction.Begin', OCPP1_6.MeterValuesRequestContext.Transaction_Begin],
        ['Transaction.End', OCPP1_6.MeterValuesRequestContext.Transaction_End],
        ['Trigger', OCPP1_6.MeterValuesRequestContext.Trigger],
      ] as const)('converts %s to OCPP 1.6 context', (native, expected) => {
        expect(MeterValueMapper.toReadingContextEnumType(native)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.toReadingContextEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.toReadingContextEnumType(undefined)).toBeUndefined();
      });
    });

    describe('fromReadingContextEnumType', () => {
      it.each([
        [OCPP1_6.MeterValuesRequestContext.Interruption_Begin, 'Interruption.Begin'],
        [OCPP1_6.MeterValuesRequestContext.Interruption_End, 'Interruption.End'],
        [OCPP1_6.MeterValuesRequestContext.Other, 'Other'],
        [OCPP1_6.MeterValuesRequestContext.Sample_Clock, 'Sample.Clock'],
        [OCPP1_6.MeterValuesRequestContext.Sample_Periodic, 'Sample.Periodic'],
        [OCPP1_6.MeterValuesRequestContext.Transaction_Begin, 'Transaction.Begin'],
        [OCPP1_6.MeterValuesRequestContext.Transaction_End, 'Transaction.End'],
        [OCPP1_6.MeterValuesRequestContext.Trigger, 'Trigger'],
      ] as const)('converts OCPP 1.6 context %s to native', (ocpp, expected) => {
        expect(MeterValueMapper.fromReadingContextEnumType(ocpp)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.fromReadingContextEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.fromReadingContextEnumType(undefined)).toBeUndefined();
      });

      it('defaults to Sample.Periodic for unknown values', () => {
        expect(MeterValueMapper.fromReadingContextEnumType('unknown' as any)).toBe(
          'Sample.Periodic',
        );
      });
    });
  });

  describe('Measurand conversions', () => {
    describe('toMeasurandEnumType', () => {
      it.each([
        ['Current.Export', OCPP1_6.MeterValuesRequestMeasurand.Current_Export],
        ['Current.Import', OCPP1_6.MeterValuesRequestMeasurand.Current_Import],
        [
          'Energy.Active.Import.Register',
          OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Register,
        ],
        [
          'Energy.Active.Import.Interval',
          OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Interval,
        ],
        ['Frequency', OCPP1_6.MeterValuesRequestMeasurand.Frequency],
        ['Power.Active.Import', OCPP1_6.MeterValuesRequestMeasurand.Power_Active_Import],
        ['SoC', OCPP1_6.MeterValuesRequestMeasurand.SoC],
        ['Voltage', OCPP1_6.MeterValuesRequestMeasurand.Voltage],
      ] as const)('converts %s to OCPP 1.6 measurand', (native, expected) => {
        expect(MeterValueMapper.toMeasurandEnumType(native)).toBe(expected);
      });

      it('returns undefined for OCPP 2.0.1-only measurands', () => {
        expect(MeterValueMapper.toMeasurandEnumType('Energy.Active.Net')).toBeUndefined();
        expect(MeterValueMapper.toMeasurandEnumType('Energy.Apparent.Net')).toBeUndefined();
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.toMeasurandEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.toMeasurandEnumType(undefined)).toBeUndefined();
      });
    });

    describe('fromMeasurandEnumType', () => {
      it.each([
        [OCPP1_6.MeterValuesRequestMeasurand.Current_Export, 'Current.Export'],
        [OCPP1_6.MeterValuesRequestMeasurand.Current_Import, 'Current.Import'],
        [
          OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Register,
          'Energy.Active.Import.Register',
        ],
        [OCPP1_6.MeterValuesRequestMeasurand.RPM, 'RPM'],
        [OCPP1_6.MeterValuesRequestMeasurand.Temperature, 'Temperature'],
        [OCPP1_6.MeterValuesRequestMeasurand.Voltage, 'Voltage'],
      ] as const)('converts OCPP 1.6 measurand %s to native', (ocpp, expected) => {
        expect(MeterValueMapper.fromMeasurandEnumType(ocpp)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.fromMeasurandEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.fromMeasurandEnumType(undefined)).toBeUndefined();
      });

      it('defaults to Energy.Active.Import.Register for unknown values', () => {
        expect(MeterValueMapper.fromMeasurandEnumType('unknown' as any)).toBe(
          'Energy.Active.Import.Register',
        );
      });
    });
  });

  describe('Location conversions', () => {
    describe('toLocationEnumType', () => {
      it.each([
        ['Body', OCPP1_6.MeterValuesRequestLocation.Body],
        ['Cable', OCPP1_6.MeterValuesRequestLocation.Cable],
        ['EV', OCPP1_6.MeterValuesRequestLocation.EV],
        ['Inlet', OCPP1_6.MeterValuesRequestLocation.Inlet],
        ['Outlet', OCPP1_6.MeterValuesRequestLocation.Outlet],
      ] as const)('converts %s to OCPP 1.6 location', (native, expected) => {
        expect(MeterValueMapper.toLocationEnumType(native)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.toLocationEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.toLocationEnumType(undefined)).toBeUndefined();
      });
    });

    describe('fromLocationEnumType', () => {
      it.each([
        [OCPP1_6.MeterValuesRequestLocation.Body, 'Body'],
        [OCPP1_6.MeterValuesRequestLocation.Cable, 'Cable'],
        [OCPP1_6.MeterValuesRequestLocation.EV, 'EV'],
        [OCPP1_6.MeterValuesRequestLocation.Inlet, 'Inlet'],
        [OCPP1_6.MeterValuesRequestLocation.Outlet, 'Outlet'],
      ] as const)('converts OCPP 1.6 location %s to native', (ocpp, expected) => {
        expect(MeterValueMapper.fromLocationEnumType(ocpp)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.fromLocationEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.fromLocationEnumType(undefined)).toBeUndefined();
      });

      it('defaults to Outlet for unknown values', () => {
        expect(MeterValueMapper.fromLocationEnumType('unknown' as any)).toBe('Outlet');
      });
    });
  });

  describe('Phase conversions', () => {
    describe('toPhaseEnumType', () => {
      it.each([
        ['L1', OCPP1_6.MeterValuesRequestPhase.L1],
        ['L2', OCPP1_6.MeterValuesRequestPhase.L2],
        ['L3', OCPP1_6.MeterValuesRequestPhase.L3],
        ['N', OCPP1_6.MeterValuesRequestPhase.N],
        ['L1-N', OCPP1_6.MeterValuesRequestPhase.L1_N],
        ['L2-N', OCPP1_6.MeterValuesRequestPhase.L2_N],
        ['L3-N', OCPP1_6.MeterValuesRequestPhase.L3_N],
        ['L1-L2', OCPP1_6.MeterValuesRequestPhase.L1_L2],
        ['L2-L3', OCPP1_6.MeterValuesRequestPhase.L2_L3],
        ['L3-L1', OCPP1_6.MeterValuesRequestPhase.L3_L1],
      ] as const)('converts %s to OCPP 1.6 phase', (native, expected) => {
        expect(MeterValueMapper.toPhaseEnumType(native)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.toPhaseEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.toPhaseEnumType(undefined)).toBeUndefined();
      });
    });

    describe('fromPhaseEnumType', () => {
      it.each([
        [OCPP1_6.MeterValuesRequestPhase.L1, 'L1'],
        [OCPP1_6.MeterValuesRequestPhase.L2, 'L2'],
        [OCPP1_6.MeterValuesRequestPhase.L3, 'L3'],
        [OCPP1_6.MeterValuesRequestPhase.N, 'N'],
        [OCPP1_6.MeterValuesRequestPhase.L1_N, 'L1-N'],
        [OCPP1_6.MeterValuesRequestPhase.L2_N, 'L2-N'],
        [OCPP1_6.MeterValuesRequestPhase.L3_N, 'L3-N'],
        [OCPP1_6.MeterValuesRequestPhase.L1_L2, 'L1-L2'],
        [OCPP1_6.MeterValuesRequestPhase.L2_L3, 'L2-L3'],
        [OCPP1_6.MeterValuesRequestPhase.L3_L1, 'L3-L1'],
      ] as const)('converts OCPP 1.6 phase %s to native', (ocpp, expected) => {
        expect(MeterValueMapper.fromPhaseEnumType(ocpp)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.fromPhaseEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.fromPhaseEnumType(undefined)).toBeUndefined();
      });
    });
  });

  describe('Unit conversions', () => {
    describe('toUnitEnumType', () => {
      it.each([
        ['Wh', OCPP1_6.MeterValuesRequestUnit.Wh],
        ['kWh', OCPP1_6.MeterValuesRequestUnit.kWh],
        ['W', OCPP1_6.MeterValuesRequestUnit.W],
        ['kW', OCPP1_6.MeterValuesRequestUnit.kW],
        ['A', OCPP1_6.MeterValuesRequestUnit.A],
        ['V', OCPP1_6.MeterValuesRequestUnit.V],
        ['Percent', OCPP1_6.MeterValuesRequestUnit.Percent],
        ['Celsius', OCPP1_6.MeterValuesRequestUnit.Celsius],
      ] as const)('converts %s to OCPP 1.6 unit', (native, expected) => {
        expect(MeterValueMapper.toUnitEnumType(native)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.toUnitEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.toUnitEnumType(undefined)).toBeUndefined();
      });
    });

    describe('fromUnitEnumType', () => {
      it.each([
        [OCPP1_6.MeterValuesRequestUnit.Wh, 'Wh'],
        [OCPP1_6.MeterValuesRequestUnit.kWh, 'kWh'],
        [OCPP1_6.MeterValuesRequestUnit.W, 'W'],
        [OCPP1_6.MeterValuesRequestUnit.kW, 'kW'],
        [OCPP1_6.MeterValuesRequestUnit.A, 'A'],
        [OCPP1_6.MeterValuesRequestUnit.V, 'V'],
        [OCPP1_6.MeterValuesRequestUnit.Percent, 'Percent'],
        [OCPP1_6.MeterValuesRequestUnit.Celsius, 'Celsius'],
        [OCPP1_6.MeterValuesRequestUnit.Celcius, 'Celsius'], // Handles typo in OCPP 1.6
      ] as const)('converts OCPP 1.6 unit %s to native', (ocpp, expected) => {
        expect(MeterValueMapper.fromUnitEnumType(ocpp)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.fromUnitEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.fromUnitEnumType(undefined)).toBeUndefined();
      });
    });
  });

  describe('validateFormat', () => {
    it('returns true for Raw format', () => {
      expect(MeterValueMapper.validateFormat(OCPP1_6.MeterValuesRequestFormat.Raw)).toBe(true);
    });

    it('returns true for undefined format', () => {
      expect(MeterValueMapper.validateFormat(undefined)).toBe(true);
    });

    it('returns false for SignedData format', () => {
      expect(MeterValueMapper.validateFormat(OCPP1_6.MeterValuesRequestFormat.SignedData)).toBe(
        false,
      );
    });
  });

  describe('SampledValue conversions', () => {
    describe('toSampledValueType', () => {
      it('converts a complete native SampledValue to OCPP 1.6', () => {
        const sampledValue: SampledValue = {
          value: 12.5,
          context: 'Sample.Periodic',
          measurand: 'Energy.Active.Import.Register',
          phase: 'L1',
          location: 'Outlet',
          unitOfMeasure: { unit: 'kWh', multiplier: 0 },
        };

        const result = MeterValueMapper.toSampledValueType(sampledValue);

        expect(result.value).toBe('12.5');
        expect(result.context).toBe(OCPP1_6.MeterValuesRequestContext.Sample_Periodic);
        expect(result.measurand).toBe(
          OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Register,
        );
        expect(result.phase).toBe(OCPP1_6.MeterValuesRequestPhase.L1);
        expect(result.location).toBe(OCPP1_6.MeterValuesRequestLocation.Outlet);
        expect(result.unit).toBe(OCPP1_6.MeterValuesRequestUnit.kWh);
      });

      it('applies multiplier to value', () => {
        const sampledValue: SampledValue = {
          value: 5,
          measurand: 'Energy.Active.Import.Register',
          unitOfMeasure: { unit: 'Wh', multiplier: 3 }, // multiplier=3 means * 10^3
        };

        const result = MeterValueMapper.toSampledValueType(sampledValue);

        expect(result.value).toBe('5000'); // 5 * 10^3
      });

      it('handles minimal SampledValue', () => {
        const sampledValue: SampledValue = {
          value: 100,
        };

        const result = MeterValueMapper.toSampledValueType(sampledValue);

        expect(result.value).toBe('100');
        expect(result.context).toBeUndefined();
        expect(result.measurand).toBeUndefined();
        expect(result.phase).toBeUndefined();
        expect(result.location).toBeUndefined();
        expect(result.unit).toBeUndefined();
      });
    });

    describe('fromSampledValueType', () => {
      it('converts a complete OCPP 1.6 sampledValue to native', () => {
        const ocppSampledValue: OCPP1_6.MeterValuesRequest['meterValue'][0]['sampledValue'][0] = {
          value: '25.5',
          context: OCPP1_6.MeterValuesRequestContext.Transaction_Begin,
          measurand: OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Register,
          phase: OCPP1_6.MeterValuesRequestPhase.L2,
          location: OCPP1_6.MeterValuesRequestLocation.Cable,
          unit: OCPP1_6.MeterValuesRequestUnit.kWh,
        };

        const result = MeterValueMapper.fromSampledValueType(ocppSampledValue);

        expect(result).toBeDefined();
        expect(result!.value).toBe(25.5);
        expect(result!.context).toBe('Transaction.Begin');
        expect(result!.measurand).toBe('Energy.Active.Import.Register');
        expect(result!.phase).toBe('L2');
        expect(result!.location).toBe('Cable');
        expect(result!.unitOfMeasure).toEqual({ unit: 'kWh', multiplier: 0 });
      });

      it('returns undefined for SignedData format', () => {
        const ocppSampledValue: OCPP1_6.MeterValuesRequest['meterValue'][0]['sampledValue'][0] = {
          value: '123',
          format: OCPP1_6.MeterValuesRequestFormat.SignedData,
        };

        const result = MeterValueMapper.fromSampledValueType(ocppSampledValue);

        expect(result).toBeUndefined();
      });

      it('handles minimal OCPP 1.6 sampledValue', () => {
        const ocppSampledValue: OCPP1_6.MeterValuesRequest['meterValue'][0]['sampledValue'][0] = {
          value: '50',
        };

        const result = MeterValueMapper.fromSampledValueType(ocppSampledValue);

        expect(result).toBeDefined();
        expect(result!.value).toBe(50);
        expect(result!.context).toBeUndefined();
        expect(result!.measurand).toBeUndefined();
      });
    });
  });

  describe('MeterValue conversions', () => {
    describe('toMeterValueType', () => {
      it('converts a MeterValueDto to OCPP 1.6 MeterValue', () => {
        const meterValue: MeterValueDto = {
          timestamp: '2025-05-29T12:00:00Z',
          sampledValue: [
            {
              value: 100,
              measurand: 'Energy.Active.Import.Register',
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
          ],
        };

        const result = MeterValueMapper.toMeterValueType(meterValue);

        expect(result.timestamp).toBe('2025-05-29T12:00:00Z');
        expect(result.sampledValue).toHaveLength(1);
        expect(result.sampledValue[0].value).toBe('100');
      });
    });

    describe('fromMeterValueType', () => {
      it('converts an OCPP 1.6 MeterValue to MeterValueDto', () => {
        const ocppMeterValue: OCPP1_6.MeterValuesRequest['meterValue'][0] = {
          timestamp: '2025-05-29T14:30:00Z',
          sampledValue: [
            {
              value: '200',
              measurand: OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Register,
              unit: OCPP1_6.MeterValuesRequestUnit.kWh,
            },
          ],
        };

        const result = MeterValueMapper.fromMeterValueType(ocppMeterValue);

        expect(result.timestamp).toBe('2025-05-29T14:30:00Z');
        expect(result.sampledValue).toHaveLength(1);
        expect(result.sampledValue[0].value).toBe(200);
        expect(result.sampledValue[0].measurand).toBe('Energy.Active.Import.Register');
      });
    });
  });

  describe('Round-trip conversions', () => {
    it('preserves data through to/from conversion for SampledValue', () => {
      const original: SampledValue = {
        value: 42.5,
        context: 'Sample.Periodic',
        measurand: 'Energy.Active.Import.Register',
        phase: 'L1',
        location: 'Outlet',
        unitOfMeasure: { unit: 'kWh', multiplier: 0 },
      };

      const ocpp = MeterValueMapper.toSampledValueType(original);
      const restored = MeterValueMapper.fromSampledValueType(ocpp);

      expect(restored).toBeDefined();
      expect(restored!.value).toBe(original.value);
      expect(restored!.context).toBe(original.context);
      expect(restored!.measurand).toBe(original.measurand);
      expect(restored!.phase).toBe(original.phase);
      expect(restored!.location).toBe(original.location);
      expect(restored!.unitOfMeasure?.unit).toBe(original.unitOfMeasure?.unit);
    });

    it('preserves data through from/to conversion for OCPP 1.6 SampledValue', () => {
      const original: OCPP1_6.MeterValuesRequest['meterValue'][0]['sampledValue'][0] = {
        value: '75.25',
        context: OCPP1_6.MeterValuesRequestContext.Transaction_End,
        measurand: OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Register,
        phase: OCPP1_6.MeterValuesRequestPhase.L3,
        location: OCPP1_6.MeterValuesRequestLocation.Body,
        unit: OCPP1_6.MeterValuesRequestUnit.kWh,
      };

      const native = MeterValueMapper.fromSampledValueType(original);
      const restored = MeterValueMapper.toSampledValueType(native!);

      expect(restored.value).toBe(original.value);
      expect(restored.context).toBe(original.context);
      expect(restored.measurand).toBe(original.measurand);
      expect(restored.phase).toBe(original.phase);
      expect(restored.location).toBe(original.location);
      expect(restored.unit).toBe(original.unit);
    });
  });
});
