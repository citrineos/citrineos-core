// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_0_1, type SampledValue, type MeterValueDto } from '@citrineos/base';
import { describe, expect, it } from 'vitest';
import { MeterValueMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';

describe('MeterValueMapper (OCPP 2.0.1)', () => {
  describe('ReadingContext conversions', () => {
    describe('toReadingContextEnumType', () => {
      it.each([
        ['Interruption.Begin', OCPP2_0_1.ReadingContextEnumType.Interruption_Begin],
        ['Interruption.End', OCPP2_0_1.ReadingContextEnumType.Interruption_End],
        ['Other', OCPP2_0_1.ReadingContextEnumType.Other],
        ['Sample.Clock', OCPP2_0_1.ReadingContextEnumType.Sample_Clock],
        ['Sample.Periodic', OCPP2_0_1.ReadingContextEnumType.Sample_Periodic],
        ['Transaction.Begin', OCPP2_0_1.ReadingContextEnumType.Transaction_Begin],
        ['Transaction.End', OCPP2_0_1.ReadingContextEnumType.Transaction_End],
        ['Trigger', OCPP2_0_1.ReadingContextEnumType.Trigger],
      ] as const)('converts %s to OCPP 2.0.1 context', (native, expected) => {
        expect(MeterValueMapper.toReadingContextEnumType(native)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.toReadingContextEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.toReadingContextEnumType(undefined)).toBeUndefined();
      });
    });

    describe('fromReadingContextEnumType', () => {
      it.each([
        [OCPP2_0_1.ReadingContextEnumType.Interruption_Begin, 'Interruption.Begin'],
        [OCPP2_0_1.ReadingContextEnumType.Interruption_End, 'Interruption.End'],
        [OCPP2_0_1.ReadingContextEnumType.Other, 'Other'],
        [OCPP2_0_1.ReadingContextEnumType.Sample_Clock, 'Sample.Clock'],
        [OCPP2_0_1.ReadingContextEnumType.Sample_Periodic, 'Sample.Periodic'],
        [OCPP2_0_1.ReadingContextEnumType.Transaction_Begin, 'Transaction.Begin'],
        [OCPP2_0_1.ReadingContextEnumType.Transaction_End, 'Transaction.End'],
        [OCPP2_0_1.ReadingContextEnumType.Trigger, 'Trigger'],
      ] as const)('converts OCPP 2.0.1 context %s to native', (ocpp, expected) => {
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
        ['Current.Export', OCPP2_0_1.MeasurandEnumType.Current_Export],
        ['Current.Import', OCPP2_0_1.MeasurandEnumType.Current_Import],
        [
          'Energy.Active.Import.Register',
          OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
        ],
        [
          'Energy.Active.Import.Interval',
          OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval,
        ],
        ['Energy.Active.Net', OCPP2_0_1.MeasurandEnumType.Energy_Active_Net],
        ['Energy.Apparent.Net', OCPP2_0_1.MeasurandEnumType.Energy_Apparent_Net],
        ['Frequency', OCPP2_0_1.MeasurandEnumType.Frequency],
        ['Power.Active.Import', OCPP2_0_1.MeasurandEnumType.Power_Active_Import],
        ['SoC', OCPP2_0_1.MeasurandEnumType.SoC],
        ['Voltage', OCPP2_0_1.MeasurandEnumType.Voltage],
      ] as const)('converts %s to OCPP 2.0.1 measurand', (native, expected) => {
        expect(MeterValueMapper.toMeasurandEnumType(native)).toBe(expected);
      });

      it('returns undefined for OCPP 1.6-only measurands', () => {
        expect(MeterValueMapper.toMeasurandEnumType('Temperature')).toBeUndefined();
        expect(MeterValueMapper.toMeasurandEnumType('RPM')).toBeUndefined();
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.toMeasurandEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.toMeasurandEnumType(undefined)).toBeUndefined();
      });
    });

    describe('fromMeasurandEnumType', () => {
      it.each([
        [OCPP2_0_1.MeasurandEnumType.Current_Export, 'Current.Export'],
        [OCPP2_0_1.MeasurandEnumType.Current_Import, 'Current.Import'],
        [
          OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
          'Energy.Active.Import.Register',
        ],
        [OCPP2_0_1.MeasurandEnumType.Energy_Active_Net, 'Energy.Active.Net'],
        [OCPP2_0_1.MeasurandEnumType.Energy_Apparent_Net, 'Energy.Apparent.Net'],
        [OCPP2_0_1.MeasurandEnumType.Voltage, 'Voltage'],
      ] as const)('converts OCPP 2.0.1 measurand %s to native', (ocpp, expected) => {
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
        ['Body', OCPP2_0_1.LocationEnumType.Body],
        ['Cable', OCPP2_0_1.LocationEnumType.Cable],
        ['EV', OCPP2_0_1.LocationEnumType.EV],
        ['Inlet', OCPP2_0_1.LocationEnumType.Inlet],
        ['Outlet', OCPP2_0_1.LocationEnumType.Outlet],
      ] as const)('converts %s to OCPP 2.0.1 location', (native, expected) => {
        expect(MeterValueMapper.toLocationEnumType(native)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.toLocationEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.toLocationEnumType(undefined)).toBeUndefined();
      });
    });

    describe('fromLocationEnumType', () => {
      it.each([
        [OCPP2_0_1.LocationEnumType.Body, 'Body'],
        [OCPP2_0_1.LocationEnumType.Cable, 'Cable'],
        [OCPP2_0_1.LocationEnumType.EV, 'EV'],
        [OCPP2_0_1.LocationEnumType.Inlet, 'Inlet'],
        [OCPP2_0_1.LocationEnumType.Outlet, 'Outlet'],
      ] as const)('converts OCPP 2.0.1 location %s to native', (ocpp, expected) => {
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
        ['L1', OCPP2_0_1.PhaseEnumType.L1],
        ['L2', OCPP2_0_1.PhaseEnumType.L2],
        ['L3', OCPP2_0_1.PhaseEnumType.L3],
        ['N', OCPP2_0_1.PhaseEnumType.N],
        ['L1-N', OCPP2_0_1.PhaseEnumType.L1_N],
        ['L2-N', OCPP2_0_1.PhaseEnumType.L2_N],
        ['L3-N', OCPP2_0_1.PhaseEnumType.L3_N],
        ['L1-L2', OCPP2_0_1.PhaseEnumType.L1_L2],
        ['L2-L3', OCPP2_0_1.PhaseEnumType.L2_L3],
        ['L3-L1', OCPP2_0_1.PhaseEnumType.L3_L1],
      ] as const)('converts %s to OCPP 2.0.1 phase', (native, expected) => {
        expect(MeterValueMapper.toPhaseEnumType(native)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.toPhaseEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.toPhaseEnumType(undefined)).toBeUndefined();
      });
    });

    describe('fromPhaseEnumType', () => {
      it.each([
        [OCPP2_0_1.PhaseEnumType.L1, 'L1'],
        [OCPP2_0_1.PhaseEnumType.L2, 'L2'],
        [OCPP2_0_1.PhaseEnumType.L3, 'L3'],
        [OCPP2_0_1.PhaseEnumType.N, 'N'],
        [OCPP2_0_1.PhaseEnumType.L1_N, 'L1-N'],
        [OCPP2_0_1.PhaseEnumType.L2_N, 'L2-N'],
        [OCPP2_0_1.PhaseEnumType.L3_N, 'L3-N'],
        [OCPP2_0_1.PhaseEnumType.L1_L2, 'L1-L2'],
        [OCPP2_0_1.PhaseEnumType.L2_L3, 'L2-L3'],
        [OCPP2_0_1.PhaseEnumType.L3_L1, 'L3-L1'],
      ] as const)('converts OCPP 2.0.1 phase %s to native', (ocpp, expected) => {
        expect(MeterValueMapper.fromPhaseEnumType(ocpp)).toBe(expected);
      });

      it('returns undefined for null/undefined', () => {
        expect(MeterValueMapper.fromPhaseEnumType(null)).toBeUndefined();
        expect(MeterValueMapper.fromPhaseEnumType(undefined)).toBeUndefined();
      });
    });
  });

  describe('toSampledValueTypes', () => {
    it('converts an array of native SampledValues to OCPP 2.0.1', () => {
      const sampledValues: SampledValue[] = [
        {
          value: 100,
          measurand: 'Energy.Active.Import.Register',
          context: 'Sample.Periodic',
          unitOfMeasure: { unit: 'kWh', multiplier: 0 },
        },
        {
          value: 230,
          measurand: 'Voltage',
          phase: 'L1',
          unitOfMeasure: { unit: 'V', multiplier: 0 },
        },
      ];

      const result = MeterValueMapper.toSampledValueTypes(sampledValues);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(100);
      expect(result[0].measurand).toBe(OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register);
      expect(result[1].value).toBe(230);
      expect(result[1].measurand).toBe(OCPP2_0_1.MeasurandEnumType.Voltage);
    });

    it('filters out unsupported measurands', () => {
      const sampledValues: SampledValue[] = [
        {
          value: 100,
          measurand: 'Energy.Active.Import.Register',
        },
        {
          value: 25,
          measurand: 'Temperature', // Not supported in OCPP 2.0.1
        },
      ];

      const result = MeterValueMapper.toSampledValueTypes(sampledValues);

      expect(result).toHaveLength(1);
      expect(result[0].measurand).toBe(OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register);
    });

    it('throws error for empty array', () => {
      expect(() => MeterValueMapper.toSampledValueTypes([])).toThrow('Invalid sampledValues');
    });

    it('includes signedMeterValue when present', () => {
      const sampledValues: SampledValue[] = [
        {
          value: 100,
          measurand: 'Energy.Active.Import.Register',
          signedMeterValue: {
            signedMeterData: 'data123',
            signingMethod: 'ECDSA',
            encodingMethod: 'OCMF',
            publicKey: 'abc123',
          },
        },
      ];

      const result = MeterValueMapper.toSampledValueTypes(sampledValues);

      expect(result[0].signedMeterValue).toBeDefined();
      expect(result[0].signedMeterValue!.signedMeterData).toBe('data123');
      expect(result[0].signedMeterValue!.signingMethod).toBe('ECDSA');
    });
  });

  describe('fromSampledValueTypes', () => {
    it('converts an array of OCPP 2.0.1 SampledValues to native', () => {
      const ocppSampledValues: OCPP2_0_1.SampledValueType[] = [
        {
          value: 150,
          measurand: OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
          context: OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
          unitOfMeasure: { unit: 'kWh', multiplier: 0 },
        },
        {
          value: 231,
          measurand: OCPP2_0_1.MeasurandEnumType.Voltage,
          phase: OCPP2_0_1.PhaseEnumType.L2,
        },
      ];

      const result = MeterValueMapper.fromSampledValueTypes(ocppSampledValues);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(150);
      expect(result[0].measurand).toBe('Energy.Active.Import.Register');
      expect(result[0].context).toBe('Sample.Periodic');
      expect(result[1].value).toBe(231);
      expect(result[1].measurand).toBe('Voltage');
      expect(result[1].phase).toBe('L2');
    });

    it('throws error for empty array', () => {
      expect(() => MeterValueMapper.fromSampledValueTypes([])).toThrow('Invalid sampledValueTypes');
    });

    it('includes signedMeterValue when present', () => {
      const ocppSampledValues: OCPP2_0_1.SampledValueType[] = [
        {
          value: 200,
          signedMeterValue: {
            signedMeterData: 'signed-data',
            signingMethod: 'RSA',
            encodingMethod: 'Base64',
            publicKey: 'pubkey123',
          },
        },
      ];

      const result = MeterValueMapper.fromSampledValueTypes(ocppSampledValues);

      expect(result[0].signedMeterValue).toBeDefined();
      expect(result[0].signedMeterValue!.signedMeterData).toBe('signed-data');
      expect(result[0].signedMeterValue!.publicKey).toBe('pubkey123');
    });

    it('defaults unit to Wh for Energy measurands when unit is missing', () => {
      const ocppSampledValues: OCPP2_0_1.SampledValueType[] = [
        {
          value: 100,
          measurand: OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
          unitOfMeasure: { multiplier: 0 },
        },
      ];

      const result = MeterValueMapper.fromSampledValueTypes(ocppSampledValues);

      expect(result[0].unitOfMeasure?.unit).toBe('Wh');
    });
  });

  describe('toMeterValueType', () => {
    it('converts a MeterValueDto to OCPP 2.0.1 MeterValueType', () => {
      const meterValue: MeterValueDto = {
        timestamp: '2025-05-29T12:00:00Z',
        sampledValue: [
          {
            value: 100,
            measurand: 'Energy.Active.Import.Register',
            context: 'Transaction.Begin',
            unitOfMeasure: { unit: 'kWh', multiplier: 0 },
          },
        ],
      };

      const result = MeterValueMapper.toMeterValueType(meterValue);

      expect(result.timestamp).toBe('2025-05-29T12:00:00Z');
      expect(result.sampledValue).toHaveLength(1);
      expect(result.sampledValue[0].value).toBe(100);
      expect(result.sampledValue[0].context).toBe(
        OCPP2_0_1.ReadingContextEnumType.Transaction_Begin,
      );
    });
  });

  describe('fromMeterValueType', () => {
    it('converts an OCPP 2.0.1 MeterValueType to MeterValueDto', () => {
      const ocppMeterValue: OCPP2_0_1.MeterValueType = {
        timestamp: '2025-05-29T14:30:00Z',
        sampledValue: [
          {
            value: 200,
            measurand: OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
            context: OCPP2_0_1.ReadingContextEnumType.Transaction_End,
            unitOfMeasure: { unit: 'kWh', multiplier: 0 },
          },
        ],
      };

      const result = MeterValueMapper.fromMeterValueType(ocppMeterValue);

      expect(result.timestamp).toBe('2025-05-29T14:30:00Z');
      expect(result.sampledValue).toHaveLength(1);
      expect(result.sampledValue[0].value).toBe(200);
      expect(result.sampledValue[0].measurand).toBe('Energy.Active.Import.Register');
      expect(result.sampledValue[0].context).toBe('Transaction.End');
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
        signedMeterValue: {
          signedMeterData: 'test-data',
          signingMethod: 'ECDSA',
          encodingMethod: 'OCMF',
          publicKey: 'test-key',
        },
      };

      const ocpp = MeterValueMapper.toSampledValueTypes([original]);
      const restored = MeterValueMapper.fromSampledValueTypes(ocpp);

      expect(restored[0].value).toBe(original.value);
      expect(restored[0].context).toBe(original.context);
      expect(restored[0].measurand).toBe(original.measurand);
      expect(restored[0].phase).toBe(original.phase);
      expect(restored[0].location).toBe(original.location);
      expect(restored[0].unitOfMeasure?.unit).toBe(original.unitOfMeasure?.unit);
      expect(restored[0].signedMeterValue?.signedMeterData).toBe(
        original.signedMeterValue?.signedMeterData,
      );
    });

    it('preserves data through from/to conversion for OCPP 2.0.1 SampledValue', () => {
      const original: OCPP2_0_1.SampledValueType = {
        value: 75.25,
        context: OCPP2_0_1.ReadingContextEnumType.Transaction_End,
        measurand: OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
        phase: OCPP2_0_1.PhaseEnumType.L3,
        location: OCPP2_0_1.LocationEnumType.Body,
        unitOfMeasure: { unit: 'kWh', multiplier: 0 },
      };

      const native = MeterValueMapper.fromSampledValueTypes([original]);
      const restored = MeterValueMapper.toSampledValueTypes(native);

      expect(restored[0].value).toBe(original.value);
      expect(restored[0].context).toBe(original.context);
      expect(restored[0].measurand).toBe(original.measurand);
      expect(restored[0].phase).toBe(original.phase);
      expect(restored[0].location).toBe(original.location);
    });

    it('preserves MeterValue data through round-trip conversion', () => {
      const original: MeterValueDto = {
        timestamp: '2025-06-15T10:30:00Z',
        sampledValue: [
          {
            value: 500,
            measurand: 'Energy.Active.Import.Register',
            context: 'Sample.Periodic',
            phase: 'L1',
            location: 'Outlet',
            unitOfMeasure: { unit: 'Wh', multiplier: 3 },
          },
          {
            value: 230,
            measurand: 'Voltage',
            phase: 'L1-N',
            unitOfMeasure: { unit: 'V', multiplier: 0 },
          },
        ],
      };

      const ocpp = MeterValueMapper.toMeterValueType(original);
      const restored = MeterValueMapper.fromMeterValueType(ocpp);

      expect(restored.timestamp).toBe(original.timestamp);
      expect(restored.sampledValue).toHaveLength(original.sampledValue.length);
      expect(restored.sampledValue[0].value).toBe(original.sampledValue[0].value);
      expect(restored.sampledValue[0].measurand).toBe(original.sampledValue[0].measurand);
    });
  });
});
