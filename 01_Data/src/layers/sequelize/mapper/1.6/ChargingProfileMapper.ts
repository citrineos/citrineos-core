// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP1_6 } from '@citrineos/base';
import type { ChargingProfileInput } from '../../../../interfaces/index.js';

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
      chargingProfilePurpose: profile.chargingProfilePurpose,
      chargingProfileKind: profile.chargingProfileKind,
      recurrencyKind: profile.recurrencyKind ?? undefined,
      validFrom: profile.validFrom ?? undefined,
      validTo: profile.validTo ?? undefined,
      transactionId: profile.transactionId?.toString(),
      chargingSchedule: [
        {
          id: profile.chargingProfileId,
          chargingRateUnit: profile.chargingSchedule.chargingRateUnit,
          chargingSchedulePeriod: profile.chargingSchedule.chargingSchedulePeriod.map((p) => ({
            startPeriod: p.startPeriod,
            limit: p.limit,
            numberPhases: p.numberPhases ?? undefined,
          })),
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
      chargingProfilePurpose: profile.chargingProfilePurpose,
      chargingProfileKind: profile.chargingProfileKind,
      recurrencyKind: profile.recurrencyKind ?? undefined,
      validFrom: profile.validFrom ?? undefined,
      validTo: profile.validTo ?? undefined,
      transactionId: profile.transactionId?.toString(),
      chargingSchedule: [
        {
          id: profile.chargingProfileId ?? 0,
          chargingRateUnit: profile.chargingSchedule.chargingRateUnit,
          chargingSchedulePeriod: profile.chargingSchedule.chargingSchedulePeriod.map((p) => ({
            startPeriod: p.startPeriod,
            limit: p.limit,
            numberPhases: p.numberPhases ?? undefined,
          })),
          duration: profile.chargingSchedule.duration ?? undefined,
          startSchedule: profile.chargingSchedule.startSchedule ?? undefined,
          minChargingRate: profile.chargingSchedule.minChargingRate ?? undefined,
        },
      ],
    };
  }
}
