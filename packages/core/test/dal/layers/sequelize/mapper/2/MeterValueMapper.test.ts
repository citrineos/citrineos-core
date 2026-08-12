// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_1 } from '@citrineos/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MeterValueMapper } from '@dal/layers/sequelize/mapper/2/MeterValueMapper.js';
import { MeterValueUtils } from '@base-util/MeterValueUtils.js';

describe('MeterValueMapper (OCPP 2 ingestion)', () => {
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
    ] as const)('maps common measurand %s -> %s', (input, expected) => {
      expect(MeterValueMapper.fromMeasurandEnumType(input)).toBe(expected);
    });

    // Regression: these OCPP 2.1 measurands used to fall through to Energy.Active.Import.Register,
    // corrupting the stored measurand and the transaction kWh. They now map to their own values.
    it.each([
      [OCPP2_1.MeasurandEnumType.Voltage_Minimum, 'Voltage.Minimum'],
      [OCPP2_1.MeasurandEnumType.Voltage_Maximum, 'Voltage.Maximum'],
      [OCPP2_1.MeasurandEnumType.Power_Active_Setpoint, 'Power.Active.Setpoint'],
      [OCPP2_1.MeasurandEnumType.Display_PresentSOC, 'Display.PresentSOC'],
      [OCPP2_1.MeasurandEnumType.EnergyRequest_Target, 'EnergyRequest.Target'],
      [OCPP2_1.MeasurandEnumType.Current_Import_Minimum, 'Current.Import.Minimum'],
    ] as const)('maps 2.1 measurand %s -> %s', (input, expected) => {
      expect(MeterValueMapper.fromMeasurandEnumType(input)).toBe(expected);
    });

    it('maps every OCPP 2.1 measurand to a defined value (no protocol value falls through)', () => {
      for (const measurand of Object.values(OCPP2_1.MeasurandEnumType)) {
        expect(MeterValueMapper.fromMeasurandEnumType(measurand)).toBeDefined();
      }
    });

    it('defaults an absent measurand to Energy.Active.Import.Register (spec)', () => {
      expect(MeterValueMapper.fromMeasurandEnumType(null)).toBe('Energy.Active.Import.Register');
      expect(MeterValueMapper.fromMeasurandEnumType(undefined)).toBe(
        'Energy.Active.Import.Register',
      );
    });

    it('warns and returns undefined for a non-protocol measurand', () => {
      expect(
        MeterValueMapper.fromMeasurandEnumType('NotAProtocolMeasurand' as any),
      ).toBeUndefined();
      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });

  // A 2.1 measurand is now stored as its own distinct value, so it is never counted as the energy
  // register and never poisons totalKwh.
  describe('totalKwh ignores non-register measurands', () => {
    it('computes kWh from real register readings only, ignoring a Voltage.Minimum sample', () => {
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
            {
              value: 400,
              measurand: OCPP2_1.MeasurandEnumType.Voltage_Minimum,
              unitOfMeasure: { unit: 'V', multiplier: 0 },
            },
          ],
        },
      ];

      const meterValues = raw.map((mv) => MeterValueMapper.fromMeterValueType(mv as any));

      // The voltage reading is stored as 'Voltage.Minimum', so it is neither counted nor fed to
      // normalizeToKwh (which would throw on unit 'V').
      expect(meterValues[1].sampledValue).toHaveLength(2);
      expect(meterValues[1].sampledValue[1].measurand).toBe('Voltage.Minimum');
      expect(() => MeterValueUtils.getTotalKwh(meterValues as any, 0)).not.toThrow();
      expect(MeterValueUtils.getTotalKwh(meterValues as any, 0)).toBe(100); // 200 - 100
    });
  });
});
