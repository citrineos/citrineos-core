// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  ChargingLimitSourceEnum,
  ChargingProfileKindEnum,
  ChargingProfilePurposeEnum,
  ChargingRateUnitEnum,
  OCPP2_0_1,
  OCPP2_1,
  RecurrencyKindEnum,
  type ChargingProfileDto,
  type ChargingScheduleDto,
} from '@citrineos/base';

/**
 * Input type for creating/updating a ChargingProfile via the repository.
 * Mirrors OCPP2_0_1.ChargingProfileType but uses native enum types.
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
 * Mirrors OCPP2_0_1.ChargingScheduleType but uses native enum types.
 */
export interface ChargingScheduleInput {
  id: number;
  startSchedule?: string | null;
  duration?: number | null;
  chargingRateUnit: keyof typeof ChargingRateUnitEnum;
  chargingSchedulePeriod: [ChargingSchedulePeriodInput, ...ChargingSchedulePeriodInput[]];
  minChargingRate?: number | null;
  salesTariff?: SalesTariffInput | null;
}

export interface ChargingSchedulePeriodInput {
  startPeriod: number;
  limit: number;
  numberPhases?: number | null;
  phaseToUse?: number | null;
}

export interface SalesTariffInput {
  id: number;
  salesTariffDescription?: string | null;
  numEPriceLevels?: number | null;
  salesTariffEntry: [OCPP2_0_1.SalesTariffEntryType, ...OCPP2_0_1.SalesTariffEntryType[]];
}

/**
 * Input type for creating a CompositeSchedule via the repository.
 * Mirrors OCPP2_0_1.CompositeScheduleType but uses native enum types.
 */
export interface CompositeScheduleInput {
  chargingSchedulePeriod: [ChargingSchedulePeriodInput, ...ChargingSchedulePeriodInput[]];
  evseId: number;
  duration: number;
  scheduleStart: string;
  chargingRateUnit: keyof typeof ChargingRateUnitEnum;
}

export class ChargingProfileMapper {
  // =========================================================================
  // Enum converters: Native → OCPP 2.0.1
  // Note: Native enum values are identical to OCPP 2.0.1 enum values,
  // so these are type-safe casts rather than value transformations.
  // =========================================================================

  static toChargingProfileKindEnumType(
    kind: keyof typeof ChargingProfileKindEnum,
  ): OCPP2_0_1.ChargingProfileKindEnumType {
    return kind as unknown as OCPP2_0_1.ChargingProfileKindEnumType;
  }

  static fromChargingProfileKindEnumType(
    kind: OCPP2_1.ChargingProfileKindEnumType,
  ): keyof typeof ChargingProfileKindEnum {
    return kind as unknown as keyof typeof ChargingProfileKindEnum;
  }

  static toChargingProfilePurposeEnumType(
    purpose: keyof typeof ChargingProfilePurposeEnum,
  ): OCPP2_0_1.ChargingProfilePurposeEnumType {
    return purpose as unknown as OCPP2_0_1.ChargingProfilePurposeEnumType;
  }

  static fromChargingProfilePurposeEnumType(
    purpose: OCPP2_1.ChargingProfilePurposeEnumType,
  ): keyof typeof ChargingProfilePurposeEnum {
    return purpose as unknown as keyof typeof ChargingProfilePurposeEnum;
  }

  static toRecurrencyKindEnumType(
    kind?: keyof typeof RecurrencyKindEnum | null,
  ): OCPP2_0_1.RecurrencyKindEnumType | undefined {
    if (!kind) return undefined;
    return kind as unknown as OCPP2_0_1.RecurrencyKindEnumType;
  }

  static fromRecurrencyKindEnumType(
    kind?: OCPP2_0_1.RecurrencyKindEnumType | null,
  ): keyof typeof RecurrencyKindEnum | undefined {
    if (!kind) return undefined;
    return kind as unknown as keyof typeof RecurrencyKindEnum;
  }

  static toChargingRateUnitEnumType(
    unit: keyof typeof ChargingRateUnitEnum,
  ): OCPP2_0_1.ChargingRateUnitEnumType {
    return unit as unknown as OCPP2_0_1.ChargingRateUnitEnumType;
  }

  static fromChargingRateUnitEnumType(
    unit: OCPP2_0_1.ChargingRateUnitEnumType,
  ): keyof typeof ChargingRateUnitEnum {
    return unit as unknown as keyof typeof ChargingRateUnitEnum;
  }

  static toChargingLimitSourceEnumType(
    source?: keyof typeof ChargingLimitSourceEnum | null,
  ): OCPP2_0_1.ChargingLimitSourceEnumType | undefined {
    if (!source) return undefined;
    return source as unknown as OCPP2_0_1.ChargingLimitSourceEnumType;
  }

  static fromChargingLimitSourceEnumType(
    source?: OCPP2_1.ChargingLimitSourceEnumType | null,
  ): keyof typeof ChargingLimitSourceEnum | undefined {
    if (!source) return undefined;
    return source as unknown as keyof typeof ChargingLimitSourceEnum;
  }

  // =========================================================================
  // Object converters: OCPP 2.0.1 → Native
  // =========================================================================

  /**
   * Converts OCPP2_0_1.ChargingProfileType to a native ChargingProfileInput.
   */
  static fromChargingProfileType(
    chargingProfile: OCPP2_1.ChargingProfileType,
  ): ChargingProfileInput {
    return {
      id: chargingProfile.id,
      stackLevel: chargingProfile.stackLevel,
      chargingProfilePurpose: ChargingProfileMapper.fromChargingProfilePurposeEnumType(
        chargingProfile.chargingProfilePurpose,
      ),
      chargingProfileKind: ChargingProfileMapper.fromChargingProfileKindEnumType(
        chargingProfile.chargingProfileKind,
      ),
      recurrencyKind: ChargingProfileMapper.fromRecurrencyKindEnumType(
        chargingProfile.recurrencyKind,
      ),
      validFrom: chargingProfile.validFrom,
      validTo: chargingProfile.validTo,
      chargingSchedule: chargingProfile.chargingSchedule.map((schedule) =>
        ChargingProfileMapper.fromChargingScheduleType(schedule),
      ) as ChargingProfileInput['chargingSchedule'],
      transactionId: chargingProfile.transactionId,
    };
  }

  /**
   * Converts OCPP2_0_1.ChargingScheduleType to a native ChargingScheduleInput.
   */
  static fromChargingScheduleType(schedule: OCPP2_1.ChargingScheduleType): ChargingScheduleInput {
    return {
      id: schedule.id,
      startSchedule: schedule.startSchedule,
      duration: schedule.duration,
      chargingRateUnit: ChargingProfileMapper.fromChargingRateUnitEnumType(
        schedule.chargingRateUnit,
      ),
      chargingSchedulePeriod: schedule.chargingSchedulePeriod.map((period) => ({
        startPeriod: period.startPeriod,
        limit: period.limit,
        numberPhases: period.numberPhases,
        phaseToUse: period.phaseToUse,
      })) as [ChargingSchedulePeriodInput, ...ChargingSchedulePeriodInput[]],
      minChargingRate: schedule.minChargingRate,
      salesTariff: schedule.salesTariff
        ? {
            id: schedule.salesTariff.id,
            salesTariffDescription: schedule.salesTariff.salesTariffDescription,
            numEPriceLevels: schedule.salesTariff.numEPriceLevels,
            salesTariffEntry: schedule.salesTariff.salesTariffEntry,
          }
        : undefined,
    };
  }

  /**
   * Converts OCPP2_0_1.CompositeScheduleType to a native CompositeScheduleInput.
   */
  static fromCompositeScheduleType(
    compositeSchedule: OCPP2_1.CompositeScheduleType,
  ): CompositeScheduleInput {
    return {
      chargingSchedulePeriod: compositeSchedule.chargingSchedulePeriod.map((period) => ({
        startPeriod: period.startPeriod,
        limit: period.limit,
        numberPhases: period.numberPhases,
        phaseToUse: period.phaseToUse,
      })) as [ChargingSchedulePeriodInput, ...ChargingSchedulePeriodInput[]],
      evseId: compositeSchedule.evseId,
      duration: compositeSchedule.duration,
      scheduleStart: compositeSchedule.scheduleStart,
      chargingRateUnit: ChargingProfileMapper.fromChargingRateUnitEnumType(
        compositeSchedule.chargingRateUnit,
      ),
    };
  }

  // =========================================================================
  // Object converters: Native → OCPP 2.0.1
  // =========================================================================

  /**
   * Converts a native ChargingProfile (Sequelize model) to OCPP2_0_1.ChargingProfileType.
   */
  static toChargingProfileType(
    chargingProfile: ChargingProfileDto,
    transactionId?: string | null,
  ): OCPP2_0_1.ChargingProfileType {
    return {
      id: chargingProfile.id!,
      stackLevel: chargingProfile.stackLevel,
      chargingProfilePurpose: ChargingProfileMapper.toChargingProfilePurposeEnumType(
        chargingProfile.chargingProfilePurpose,
      ),
      chargingProfileKind: ChargingProfileMapper.toChargingProfileKindEnumType(
        chargingProfile.chargingProfileKind,
      ),
      recurrencyKind: ChargingProfileMapper.toRecurrencyKindEnumType(
        chargingProfile.recurrencyKind,
      ),
      validFrom: chargingProfile.validFrom,
      validTo: chargingProfile.validTo,
      chargingSchedule: chargingProfile.chargingSchedule.map((schedule) =>
        ChargingProfileMapper.toChargingScheduleType(schedule),
      ) as OCPP2_0_1.ChargingProfileType['chargingSchedule'],
      transactionId: transactionId,
    };
  }

  /**
   * Converts a native ChargingScheduleDto to OCPP2_0_1.ChargingScheduleType.
   */
  static toChargingScheduleType(schedule: ChargingScheduleDto): OCPP2_0_1.ChargingScheduleType {
    return {
      id: schedule.id!,
      startSchedule: schedule.startSchedule,
      duration: schedule.duration,
      chargingRateUnit: ChargingProfileMapper.toChargingRateUnitEnumType(schedule.chargingRateUnit),
      chargingSchedulePeriod:
        schedule.chargingSchedulePeriod as OCPP2_0_1.ChargingScheduleType['chargingSchedulePeriod'],
      minChargingRate: schedule.minChargingRate,
      salesTariff: schedule.salesTariff
        ? {
            id: schedule.salesTariff.id!,
            salesTariffDescription: schedule.salesTariff.salesTariffDescription,
            numEPriceLevels: schedule.salesTariff.numEPriceLevels,
            salesTariffEntry: schedule.salesTariff.salesTariffEntry as [
              OCPP2_0_1.SalesTariffEntryType,
              ...OCPP2_0_1.SalesTariffEntryType[],
            ],
          }
        : undefined,
    };
  }
}
