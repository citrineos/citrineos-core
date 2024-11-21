// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { OcppRequest } from '../../../..';

export interface RemoteStartTransactionRequest extends OcppRequest {
  connectorId?: number | null;
  idTag: string;
  chargingProfile?: {
    chargingProfileId: number | null;
    transactionId?: number | null;
    stackLevel: number;
    chargingProfilePurpose: ChargingProfilePurpose;
    chargingProfileKind: ChargingProfileKind;
    recurrencyKind?: RecurrencyKind | null;
    validFrom?: string | null;
    validTo?: string | null;
    chargingSchedule: {
      duration?: number | null;
      startSchedule?: string | null;
      chargingRateUnit: ChargingRateUnit;
      chargingSchedulePeriod: {
        startPeriod: number;
        limit: number;
        numberPhases?: number | null;
      }[];
      minChargingRate?: number | null;
    };
  };
}
