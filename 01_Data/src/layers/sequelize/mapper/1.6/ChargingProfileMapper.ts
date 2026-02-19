// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  ChargingProfileKindEnum,
  ChargingProfilePurposeEnum,
  ChargingRateUnitEnum,
  OCPP1_6,
  RecurrencyKindEnum,
} from '@citrineos/base';

/**
 * Input type for creating/updating a ChargingProfile via the repository.
 * Uses native enum types.
 */
export interface ChargingProfileInput {
  id: number;
  stackLevel: number;
  chargingProfilePurpose: keyof typeof ChargingProfilePurposeEnum;
  chargingProfileKind: keyof typeof ChargingProfileKindEnum;
  recurrencyKind?: keyof typeof RecurrencyKindEnum | null;
  validFrom?: string | null;
  validTo?: string | null;
  chargingSchedule:
    | [ChargingScheduleInput]
    | [ChargingScheduleInput, ChargingScheduleInput]
    | [ChargingScheduleInput, ChargingScheduleInput, ChargingScheduleInput];
  transactionId?: string | null;
}

/**
 * Input type for creating a ChargingSchedule via the repository.
 * Uses native enum types.
 */
export interface ChargingScheduleInput {
  id: number;
  startSchedule?: string | null;
  duration?: number | null;
  chargingRateUnit: keyof typeof ChargingRateUnitEnum;
  chargingSchedulePeriod: [ChargingSchedulePeriodInput, ...ChargingSchedulePeriodInput[]];
  minChargingRate?: number | null;
}

export interface ChargingSchedulePeriodInput {
  startPeriod: number;
  limit: number;
  numberPhases?: number | null;
}

export class ChargingProfileMapper {
  /**
   * OCPP 1.6 'ChargePointMaxProfile' maps to native 'ChargingStationMaxProfile'.
   * All other enum values are identical and are type-safe casts.
   */
  static fromChargingProfilePurpose(purpose: string): keyof typeof ChargingProfilePurposeEnum {
    if (purpose === 'ChargePointMaxProfile') {
      return 'ChargingStationMaxProfile';
    }
    return purpose as keyof typeof ChargingProfilePurposeEnum;
  }

  static fromChargingProfileKind(kind: string): keyof typeof ChargingProfileKindEnum {
    return kind as unknown as keyof typeof ChargingProfileKindEnum;
  }

  static fromRecurrencyKind(kind?: string | null): keyof typeof RecurrencyKindEnum | undefined {
    if (!kind) return undefined;
    return kind as unknown as keyof typeof RecurrencyKindEnum;
  }

  static fromChargingRateUnit(unit: string): keyof typeof ChargingRateUnitEnum {
    return unit as unknown as keyof typeof ChargingRateUnitEnum;
  }

  /**
   * Converts an OCPP 1.6 SetChargingProfile csChargingProfiles to a native ChargingProfileInput.
   */
  static fromSetChargingProfileRequest(
    profile: OCPP1_6.SetChargingProfileRequest['csChargingProfiles'],
  ): ChargingProfileInput {
    return {
      id: profile.chargingProfileId,
      stackLevel: profile.stackLevel,
      chargingProfilePurpose: ChargingProfileMapper.fromChargingProfilePurpose(
        profile.chargingProfilePurpose,
      ),
      chargingProfileKind: ChargingProfileMapper.fromChargingProfileKind(
        profile.chargingProfileKind,
      ),
      recurrencyKind: ChargingProfileMapper.fromRecurrencyKind(profile.recurrencyKind),
      validFrom: profile.validFrom,
      validTo: profile.validTo,
      transactionId: profile.transactionId?.toString(),
      chargingSchedule: [
        ChargingProfileMapper.fromChargingSchedule(
          profile.chargingProfileId,
          profile.chargingSchedule,
        ),
      ],
    };
  }

  /**
   * Converts an OCPP 1.6 RemoteStartTransaction chargingProfile to a native ChargingProfileInput.
   */
  static fromRemoteStartChargingProfile(
    profile: NonNullable<OCPP1_6.RemoteStartTransactionRequest['chargingProfile']>,
  ): ChargingProfileInput {
    return {
      id: profile.chargingProfileId ?? 0,
      stackLevel: profile.stackLevel,
      chargingProfilePurpose: ChargingProfileMapper.fromChargingProfilePurpose(
        profile.chargingProfilePurpose,
      ),
      chargingProfileKind: ChargingProfileMapper.fromChargingProfileKind(
        profile.chargingProfileKind,
      ),
      recurrencyKind: ChargingProfileMapper.fromRecurrencyKind(profile.recurrencyKind),
      validFrom: profile.validFrom,
      validTo: profile.validTo,
      transactionId: profile.transactionId?.toString(),
      chargingSchedule: [
        ChargingProfileMapper.fromChargingSchedule(
          profile.chargingProfileId ?? 0,
          profile.chargingSchedule,
        ),
      ],
    };
  }

  /**
   * Converts an OCPP 1.6 ChargingSchedule to a native ChargingScheduleInput.
   * Accepts a scheduleId since OCPP 1.6 schedules don't have their own id.
   */
  static fromChargingSchedule(
    scheduleId: number,
    schedule: {
      chargingRateUnit: string;
      chargingSchedulePeriod: {
        startPeriod: number;
        limit: number;
        numberPhases?: number | null;
      }[];
      duration?: number | null;
      startSchedule?: string | null;
      minChargingRate?: number | null;
    },
  ): ChargingScheduleInput {
    return {
      id: scheduleId,
      chargingRateUnit: ChargingProfileMapper.fromChargingRateUnit(schedule.chargingRateUnit),
      chargingSchedulePeriod: schedule.chargingSchedulePeriod.map((period) => ({
        startPeriod: period.startPeriod,
        limit: period.limit,
        numberPhases: period.numberPhases,
      })) as [ChargingSchedulePeriodInput, ...ChargingSchedulePeriodInput[]],
      duration: schedule.duration,
      startSchedule: schedule.startSchedule,
      minChargingRate: schedule.minChargingRate,
    };
  }
}
