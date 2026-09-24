// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_1 } from '@citrineos/types';
import { ChargingProfileMapper } from '@dal/mappers/2.1/index.js';
import { describe, expect, it } from 'vitest';

const FULL_PERIOD: OCPP2_1.ChargingSchedulePeriodType = {
  startPeriod: 0,
  limit: 11000,
  limit_L2: 3700,
  limit_L3: 3600,
  numberPhases: 3,
  phaseToUse: 1,
  dischargeLimit: -11000,
  dischargeLimit_L2: -3700,
  dischargeLimit_L3: -3600,
  setpoint: 5000,
  setpoint_L2: 1700,
  setpoint_L3: 1600,
  setpointReactive: 200,
  setpointReactive_L2: 70,
  setpointReactive_L3: 60,
  preconditioningRequest: true,
  evseSleep: false,
  v2xBaseline: 1000,
  operationMode: OCPP2_1.OperationModeEnumType.CentralSetpoint,
  v2xFreqWattCurve: [
    { frequency: 49.8, power: 11000 },
    { frequency: 50.2, power: -11000 },
  ],
  v2xSignalWattCurve: [
    { signal: 0, power: 0 },
    { signal: 100, power: 11000 },
  ],
  customData: { vendorId: 'vendor' },
};

function aCompositeSchedule(
  periods: [OCPP2_1.ChargingSchedulePeriodType, ...OCPP2_1.ChargingSchedulePeriodType[]],
  chargingRateUnit: OCPP2_1.ChargingRateUnitEnumType = OCPP2_1.ChargingRateUnitEnumType.W,
): OCPP2_1.CompositeScheduleType {
  return {
    evseId: 1,
    duration: 3600,
    scheduleStart: '2026-09-23T09:00:00.000Z',
    chargingRateUnit,
    chargingSchedulePeriod: periods,
    customData: { vendorId: 'vendor' },
  };
}

describe('ChargingProfileMapper (2.1)', () => {
  describe('fromCompositeScheduleType', () => {
    it('keeps every 2.1 period field and drops customData', () => {
      const { customData: _customData, ...expectedPeriod } = FULL_PERIOD;

      const result = ChargingProfileMapper.fromCompositeScheduleType(
        aCompositeSchedule([FULL_PERIOD]),
      );

      expect(result).toEqual({
        evseId: 1,
        duration: 3600,
        scheduleStart: '2026-09-23T09:00:00.000Z',
        chargingRateUnit: 'W',
        chargingSchedulePeriod: [expectedPeriod],
      });
    });

    it('maps a period that carries no limit', () => {
      const result = ChargingProfileMapper.fromCompositeScheduleType(
        aCompositeSchedule([
          { startPeriod: 0, limit: 16 },
          {
            startPeriod: 600,
            setpoint: 7000,
            operationMode: OCPP2_1.OperationModeEnumType.ExternalSetpoint,
          },
        ]),
      );

      expect(result.chargingSchedulePeriod).toHaveLength(2);
      expect(result.chargingSchedulePeriod[1]).toMatchObject({
        startPeriod: 600,
        limit: undefined,
        setpoint: 7000,
        operationMode: OCPP2_1.OperationModeEnumType.ExternalSetpoint,
      });
    });

    it('maps an ampere schedule', () => {
      const result = ChargingProfileMapper.fromCompositeScheduleType(
        aCompositeSchedule([{ startPeriod: 0, limit: 16 }], OCPP2_1.ChargingRateUnitEnumType.A),
      );

      expect(result.chargingRateUnit).toBe('A');
    });
  });
});
