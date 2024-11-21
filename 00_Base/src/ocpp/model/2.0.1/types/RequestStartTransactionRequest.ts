// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import {
  ChargingProfileKindEnumType,
  ChargingProfilePurposeEnumType,
  ChargingRateUnitEnumType,
  CostKindEnumType,
  IdTokenEnumType,
  RecurrencyKindEnumType,
} from '../enums';
import { OcppRequest } from '../../..';

export interface RequestStartTransactionRequest extends OcppRequest {
  customData?: CustomDataType | null;
  /**
   * Number of the EVSE on which to start the transaction. EvseId SHALL be &gt; 0
   *
   */
  evseId?: number | null;
  groupIdToken?: IdTokenType | null;
  idToken: IdTokenType;
  /**
   * Id given by the server to this start request. The Charging Station might return this in the &lt;&lt;transactioneventrequest, TransactionEventRequest&gt;&gt;, letting the server know which transaction was started for this request. Use to start a transaction.
   *
   */
  remoteStartId: number;
  chargingProfile?: ChargingProfileType | null;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface IdTokenType {
  customData?: CustomDataType | null;
  /**
   * @minItems 1
   */
  additionalInfo?: [AdditionalInfoType, ...AdditionalInfoType[]] | null;
  /**
   * IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID.
   *
   */
  idToken: string;
  type: IdTokenEnumType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface AdditionalInfoType {
  customData?: CustomDataType | null;
  /**
   * This field specifies the additional IdToken.
   *
   */
  additionalIdToken: string;
  /**
   * This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties.
   *
   */
  type: string;
}
/**
 * Charging_ Profile
 * urn:x-oca:ocpp:uid:2:233255
 * A ChargingProfile consists of ChargingSchedule, describing the amount of power or current that can be delivered per time interval.
 *
 */
export interface ChargingProfileType {
  customData?: CustomDataType | null;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * Id of ChargingProfile.
   *
   */
  id: number;
  /**
   * Charging_ Profile. Stack_ Level. Counter
   * urn:x-oca:ocpp:uid:1:569230
   * Value determining level in hierarchy stack of profiles. Higher values have precedence over lower values. Lowest level is 0.
   *
   */
  stackLevel: number;
  chargingProfilePurpose: ChargingProfilePurposeEnumType;
  chargingProfileKind: ChargingProfileKindEnumType;
  recurrencyKind?: RecurrencyKindEnumType | null;
  /**
   * Charging_ Profile. Valid_ From. Date_ Time
   * urn:x-oca:ocpp:uid:1:569234
   * Point in time at which the profile starts to be valid. If absent, the profile is valid as soon as it is received by the Charging Station.
   *
   */
  validFrom?: string | null;
  /**
   * Charging_ Profile. Valid_ To. Date_ Time
   * urn:x-oca:ocpp:uid:1:569235
   * Point in time at which the profile stops to be valid. If absent, the profile is valid until it is replaced by another profile.
   *
   */
  validTo?: string | null;
  /**
   * @minItems 1
   * @maxItems 3
   */
  chargingSchedule:
    | [ChargingScheduleType]
    | [ChargingScheduleType, ChargingScheduleType]
    | [ChargingScheduleType, ChargingScheduleType, ChargingScheduleType];
  /**
   * SHALL only be included if ChargingProfilePurpose is set to TxProfile. The transactionId is used to match the profile to a specific transaction.
   *
   */
  transactionId?: string | null;
}
/**
 * Charging_ Schedule
 * urn:x-oca:ocpp:uid:2:233256
 * Charging schedule structure defines a list of charging periods, as used in: GetCompositeSchedule.conf and ChargingProfile.
 *
 */
export interface ChargingScheduleType {
  customData?: CustomDataType | null;
  /**
   * Identifies the ChargingSchedule.
   *
   */
  id: number;
  /**
   * Charging_ Schedule. Start_ Schedule. Date_ Time
   * urn:x-oca:ocpp:uid:1:569237
   * Starting point of an absolute schedule. If absent the schedule will be relative to start of charging.
   *
   */
  startSchedule?: string | null;
  /**
   * Charging_ Schedule. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569236
   * Duration of the charging schedule in seconds. If the duration is left empty, the last period will continue indefinitely or until end of the transaction if chargingProfilePurpose = TxProfile.
   *
   */
  duration?: number | null;
  chargingRateUnit: ChargingRateUnitEnumType;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  chargingSchedulePeriod: [
    ChargingSchedulePeriodType,
    ...ChargingSchedulePeriodType[],
  ];
  /**
   * Charging_ Schedule. Min_ Charging_ Rate. Numeric
   * urn:x-oca:ocpp:uid:1:569239
   * Minimum charging rate supported by the EV. The unit of measure is defined by the chargingRateUnit. This parameter is intended to be used by a local smart charging algorithm to optimize the power allocation for in the case a charging process is inefficient at lower charging rates. Accepts at most one digit fraction (e.g. 8.1)
   *
   */
  minChargingRate?: number | null;
  salesTariff?: SalesTariffType | null;
}
/**
 * Charging_ Schedule_ Period
 * urn:x-oca:ocpp:uid:2:233257
 * Charging schedule period structure defines a time period in a charging schedule.
 *
 */
export interface ChargingSchedulePeriodType {
  customData?: CustomDataType | null;
  /**
   * Charging_ Schedule_ Period. Start_ Period. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569240
   * Start of the period, in seconds from the start of schedule. The value of StartPeriod also defines the stop time of the previous period.
   *
   */
  startPeriod: number;
  /**
   * Charging_ Schedule_ Period. Limit. Measure
   * urn:x-oca:ocpp:uid:1:569241
   * Charging rate limit during the schedule period, in the applicable chargingRateUnit, for example in Amperes (A) or Watts (W). Accepts at most one digit fraction (e.g. 8.1).
   *
   */
  limit: number;
  /**
   * Charging_ Schedule_ Period. Number_ Phases. Counter
   * urn:x-oca:ocpp:uid:1:569242
   * The number of phases that can be used for charging. If a number of phases is needed, numberPhases=3 will be assumed unless another number is given.
   *
   */
  numberPhases?: number | null;
  /**
   * Values: 1..3, Used if numberPhases=1 and if the EVSE is capable of switching the phase connected to the EV, i.e. ACPhaseSwitchingSupported is defined and true. It’s not allowed unless both conditions above are true. If both conditions are true, and phaseToUse is omitted, the Charging Station / EVSE will make the selection on its own.
   *
   *
   */
  phaseToUse?: number | null;
}
/**
 * Sales_ Tariff
 * urn:x-oca:ocpp:uid:2:233272
 * NOTE: This dataType is based on dataTypes from &lt;&lt;ref-ISOIEC15118-2,ISO 15118-2&gt;&gt;.
 *
 */
export interface SalesTariffType {
  customData?: CustomDataType | null;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * SalesTariff identifier used to identify one sales tariff. An SAID remains a unique identifier for one schedule throughout a charging session.
   *
   */
  id: number;
  /**
   * Sales_ Tariff. Sales. Tariff_ Description
   * urn:x-oca:ocpp:uid:1:569283
   * A human readable title/short description of the sales tariff e.g. for HMI display purposes.
   *
   */
  salesTariffDescription?: string | null;
  /**
   * Sales_ Tariff. Num_ E_ Price_ Levels. Counter
   * urn:x-oca:ocpp:uid:1:569284
   * Defines the overall number of distinct price levels used across all provided SalesTariff elements.
   *
   */
  numEPriceLevels?: number | null;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  salesTariffEntry: [SalesTariffEntryType, ...SalesTariffEntryType[]];
}
/**
 * Sales_ Tariff_ Entry
 * urn:x-oca:ocpp:uid:2:233271
 *
 */
export interface SalesTariffEntryType {
  customData?: CustomDataType | null;
  relativeTimeInterval: RelativeTimeIntervalType;
  /**
   * Sales_ Tariff_ Entry. E_ Price_ Level. Unsigned_ Integer
   * urn:x-oca:ocpp:uid:1:569281
   * Defines the price level of this SalesTariffEntry (referring to NumEPriceLevels). Small values for the EPriceLevel represent a cheaper TariffEntry. Large values for the EPriceLevel represent a more expensive TariffEntry.
   *
   */
  ePriceLevel?: number | null;
  /**
   * @minItems 1
   * @maxItems 3
   */
  consumptionCost?:
    | [ConsumptionCostType]
    | [ConsumptionCostType, ConsumptionCostType]
    | [ConsumptionCostType, ConsumptionCostType, ConsumptionCostType]
    | null;
}
/**
 * Relative_ Timer_ Interval
 * urn:x-oca:ocpp:uid:2:233270
 *
 */
export interface RelativeTimeIntervalType {
  customData?: CustomDataType | null;
  /**
   * Relative_ Timer_ Interval. Start. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569279
   * Start of the interval, in seconds from NOW.
   *
   */
  start: number;
  /**
   * Relative_ Timer_ Interval. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569280
   * Duration of the interval, in seconds.
   *
   */
  duration?: number | null;
}
/**
 * Consumption_ Cost
 * urn:x-oca:ocpp:uid:2:233259
 *
 */
export interface ConsumptionCostType {
  customData?: CustomDataType | null;
  /**
   * Consumption_ Cost. Start_ Value. Numeric
   * urn:x-oca:ocpp:uid:1:569246
   * The lowest level of consumption that defines the starting point of this consumption block. The block interval extends to the start of the next interval.
   *
   */
  startValue: number;
  /**
   * @minItems 1
   * @maxItems 3
   */
  cost: [CostType] | [CostType, CostType] | [CostType, CostType, CostType];
}
/**
 * Cost
 * urn:x-oca:ocpp:uid:2:233258
 *
 */
export interface CostType {
  customData?: CustomDataType | null;
  costKind: CostKindEnumType;
  /**
   * Cost. Amount. Amount
   * urn:x-oca:ocpp:uid:1:569244
   * The estimated or actual cost per kWh
   *
   */
  amount: number;
  /**
   * Cost. Amount_ Multiplier. Integer
   * urn:x-oca:ocpp:uid:1:569245
   * Values: -3..3, The amountMultiplier defines the exponent to base 10 (dec). The final value is determined by: amount * 10 ^ amountMultiplier
   *
   */
  amountMultiplier?: number | null;
}
