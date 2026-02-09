// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP1_6, OCPP2_0_1 } from '@citrineos/base';

export class ChargingProfileMapper {
  /**
   * Maps an OCPP 1.6 SetChargingProfile csChargingProfiles object
   * to the OCPP 2.0.1 ChargingProfileType used by the DB repository.
   */
  static toChargingProfileType(
    profile: OCPP1_6.SetChargingProfileRequest['csChargingProfiles'],
  ): OCPP2_0_1.ChargingProfileType {
    return {
      id: profile.chargingProfileId,
      stackLevel: profile.stackLevel,
      chargingProfilePurpose:
        profile.chargingProfilePurpose as unknown as OCPP2_0_1.ChargingProfilePurposeEnumType,
      chargingProfileKind:
        profile.chargingProfileKind as unknown as OCPP2_0_1.ChargingProfileKindEnumType,
      recurrencyKind: profile.recurrencyKind as unknown as
        | OCPP2_0_1.RecurrencyKindEnumType
        | undefined,
      validFrom: profile.validFrom ?? undefined,
      validTo: profile.validTo ?? undefined,
      transactionId: profile.transactionId?.toString(),
      chargingSchedule: [
        {
          id: profile.chargingProfileId,
          chargingRateUnit: profile.chargingSchedule
            .chargingRateUnit as unknown as OCPP2_0_1.ChargingRateUnitEnumType,
          chargingSchedulePeriod: profile.chargingSchedule.chargingSchedulePeriod.map((p) => ({
            startPeriod: p.startPeriod,
            limit: p.limit,
            numberPhases: p.numberPhases ?? undefined,
          })) as [OCPP2_0_1.ChargingSchedulePeriodType, ...OCPP2_0_1.ChargingSchedulePeriodType[]],
          duration: profile.chargingSchedule.duration ?? undefined,
          startSchedule: profile.chargingSchedule.startSchedule ?? undefined,
          minChargingRate: profile.chargingSchedule.minChargingRate ?? undefined,
        },
      ],
    };
  }

  /**
   * Maps an OCPP 1.6 RemoteStartTransaction chargingProfile object
   * to the OCPP 2.0.1 ChargingProfileType used by the DB repository.
   */
  static remoteStartToChargingProfileType(
    profile: NonNullable<OCPP1_6.RemoteStartTransactionRequest['chargingProfile']>,
  ): OCPP2_0_1.ChargingProfileType {
    return {
      id: profile.chargingProfileId ?? 0,
      stackLevel: profile.stackLevel,
      chargingProfilePurpose:
        profile.chargingProfilePurpose as unknown as OCPP2_0_1.ChargingProfilePurposeEnumType,
      chargingProfileKind:
        profile.chargingProfileKind as unknown as OCPP2_0_1.ChargingProfileKindEnumType,
      recurrencyKind: profile.recurrencyKind as unknown as
        | OCPP2_0_1.RecurrencyKindEnumType
        | undefined,
      validFrom: profile.validFrom ?? undefined,
      validTo: profile.validTo ?? undefined,
      transactionId: profile.transactionId?.toString(),
      chargingSchedule: [
        {
          id: profile.chargingProfileId ?? 0,
          chargingRateUnit: profile.chargingSchedule
            .chargingRateUnit as unknown as OCPP2_0_1.ChargingRateUnitEnumType,
          chargingSchedulePeriod: profile.chargingSchedule.chargingSchedulePeriod.map((p) => ({
            startPeriod: p.startPeriod,
            limit: p.limit,
            numberPhases: p.numberPhases ?? undefined,
          })) as [OCPP2_0_1.ChargingSchedulePeriodType, ...OCPP2_0_1.ChargingSchedulePeriodType[]],
          duration: profile.chargingSchedule.duration ?? undefined,
          startSchedule: profile.chargingSchedule.startSchedule ?? undefined,
          minChargingRate: profile.chargingSchedule.minChargingRate ?? undefined,
        },
      ],
    };
  }
}
