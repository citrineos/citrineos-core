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
import type {
  ChargingProfileInput,
  ChargingSchedulePeriodInput,
} from '../2.0.1/ChargingProfileMapper.js';

/**
 * Maps OCPP 1.6 charging profile purpose to the native enum.
 * OCPP 1.6 uses 'ChargePointMaxProfile' while the native enum uses 'ChargingStationMaxProfile'.
 */
const PURPOSE_MAP: Record<string, keyof typeof ChargingProfilePurposeEnum> = {
  ChargePointMaxProfile: 'ChargingStationMaxProfile',
  TxDefaultProfile: 'TxDefaultProfile',
  TxProfile: 'TxProfile',
};

export class ChargingProfileMapper {
  /**
   * Maps an OCPP 1.6 SetChargingProfile csChargingProfiles object
   * to a CitrineOS ChargingProfileInput for the DB repository.
   */
  static toChargingProfileInput(
    profile: OCPP1_6.SetChargingProfileRequest['csChargingProfiles'],
  ): ChargingProfileInput {
    return {
      id: profile.chargingProfileId,
      stackLevel: profile.stackLevel,
      chargingProfilePurpose: PURPOSE_MAP[profile.chargingProfilePurpose],
      chargingProfileKind: profile.chargingProfileKind as keyof typeof ChargingProfileKindEnum,
      recurrencyKind:
        (profile.recurrencyKind as keyof typeof RecurrencyKindEnum | undefined) ?? undefined,
      validFrom: profile.validFrom ?? undefined,
      validTo: profile.validTo ?? undefined,
      transactionId: profile.transactionId?.toString(),
      chargingSchedule: [
        {
          id: profile.chargingProfileId,
          chargingRateUnit: profile.chargingSchedule
            .chargingRateUnit as keyof typeof ChargingRateUnitEnum,
          chargingSchedulePeriod: profile.chargingSchedule.chargingSchedulePeriod.map((p) => ({
            startPeriod: p.startPeriod,
            limit: p.limit,
            numberPhases: p.numberPhases ?? undefined,
          })) as [ChargingSchedulePeriodInput, ...ChargingSchedulePeriodInput[]],
          duration: profile.chargingSchedule.duration ?? undefined,
          startSchedule: profile.chargingSchedule.startSchedule ?? undefined,
          minChargingRate: profile.chargingSchedule.minChargingRate ?? undefined,
        },
      ],
    };
  }

  /**
   * Maps an OCPP 1.6 RemoteStartTransaction chargingProfile object
   * to a CitrineOS ChargingProfileInput for the DB repository.
   */
  static remoteStartToChargingProfileInput(
    profile: NonNullable<OCPP1_6.RemoteStartTransactionRequest['chargingProfile']>,
  ): ChargingProfileInput {
    return {
      id: profile.chargingProfileId ?? 0,
      stackLevel: profile.stackLevel,
      chargingProfilePurpose: PURPOSE_MAP[profile.chargingProfilePurpose],
      chargingProfileKind: profile.chargingProfileKind as keyof typeof ChargingProfileKindEnum,
      recurrencyKind:
        (profile.recurrencyKind as keyof typeof RecurrencyKindEnum | undefined) ?? undefined,
      validFrom: profile.validFrom ?? undefined,
      validTo: profile.validTo ?? undefined,
      transactionId: profile.transactionId?.toString(),
      chargingSchedule: [
        {
          id: profile.chargingProfileId ?? 0,
          chargingRateUnit: profile.chargingSchedule
            .chargingRateUnit as keyof typeof ChargingRateUnitEnum,
          chargingSchedulePeriod: profile.chargingSchedule.chargingSchedulePeriod.map((p) => ({
            startPeriod: p.startPeriod,
            limit: p.limit,
            numberPhases: p.numberPhases ?? undefined,
          })) as [ChargingSchedulePeriodInput, ...ChargingSchedulePeriodInput[]],
          duration: profile.chargingSchedule.duration ?? undefined,
          startSchedule: profile.chargingSchedule.startSchedule ?? undefined,
          minChargingRate: profile.chargingSchedule.minChargingRate ?? undefined,
        },
      ],
    };
  }
}
