// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type ChargingRateUnitEnum, OCPP2_1 } from '@citrineos/types';

export type ChargingSchedulePeriodInput = Omit<OCPP2_1.ChargingSchedulePeriodType, 'customData'>;

export interface CompositeScheduleInput {
  chargingSchedulePeriod: [ChargingSchedulePeriodInput, ...ChargingSchedulePeriodInput[]];
  evseId: number;
  duration: number;
  scheduleStart: string;
  chargingRateUnit: keyof typeof ChargingRateUnitEnum;
}

export class ChargingProfileMapper {
  static fromChargingRateUnitEnumType(
    unit: OCPP2_1.ChargingRateUnitEnumType,
  ): keyof typeof ChargingRateUnitEnum {
    switch (unit) {
      case OCPP2_1.ChargingRateUnitEnumType.W:
        return 'W';
      case OCPP2_1.ChargingRateUnitEnumType.A:
        return 'A';
    }
  }

  static fromChargingSchedulePeriodType(
    period: OCPP2_1.ChargingSchedulePeriodType,
  ): ChargingSchedulePeriodInput {
    return {
      startPeriod: period.startPeriod,
      limit: period.limit,
      limit_L2: period.limit_L2,
      limit_L3: period.limit_L3,
      numberPhases: period.numberPhases,
      phaseToUse: period.phaseToUse,
      dischargeLimit: period.dischargeLimit,
      dischargeLimit_L2: period.dischargeLimit_L2,
      dischargeLimit_L3: period.dischargeLimit_L3,
      setpoint: period.setpoint,
      setpoint_L2: period.setpoint_L2,
      setpoint_L3: period.setpoint_L3,
      setpointReactive: period.setpointReactive,
      setpointReactive_L2: period.setpointReactive_L2,
      setpointReactive_L3: period.setpointReactive_L3,
      preconditioningRequest: period.preconditioningRequest,
      evseSleep: period.evseSleep,
      v2xBaseline: period.v2xBaseline,
      operationMode: period.operationMode,
      v2xFreqWattCurve: period.v2xFreqWattCurve,
      v2xSignalWattCurve: period.v2xSignalWattCurve,
    };
  }

  static fromCompositeScheduleType(
    compositeSchedule: OCPP2_1.CompositeScheduleType,
  ): CompositeScheduleInput {
    const [firstPeriod, ...otherPeriods] = compositeSchedule.chargingSchedulePeriod;
    return {
      chargingSchedulePeriod: [
        ChargingProfileMapper.fromChargingSchedulePeriodType(firstPeriod),
        ...otherPeriods.map((period) =>
          ChargingProfileMapper.fromChargingSchedulePeriodType(period),
        ),
      ],
      evseId: compositeSchedule.evseId,
      duration: compositeSchedule.duration,
      scheduleStart: compositeSchedule.scheduleStart,
      chargingRateUnit: ChargingProfileMapper.fromChargingRateUnitEnumType(
        compositeSchedule.chargingRateUnit,
      ),
    };
  }
}
