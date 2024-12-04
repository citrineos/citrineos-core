// Copyright 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

 
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import {
  ChargingLimitSourceEnumType,
  ChargingProfilePurposeEnumType,
} from '../enums';
import { OcppRequest } from '../../../..';

export interface GetChargingProfilesRequest extends OcppRequest {
  customData?: CustomDataType | null;
  /**
   * Reference identification that is to be used by the Charging Station in the &lt;&lt;reportchargingprofilesrequest, ReportChargingProfilesRequest&gt;&gt; when provided.
   *
   */
  requestId: number;
  /**
   * For which EVSE installed charging profiles SHALL be reported. If 0, only charging profiles installed on the Charging Station itself (the grid connection) SHALL be reported. If omitted, all installed charging profiles SHALL be reported.
   *
   */
  evseId?: number | null;
  chargingProfile: ChargingProfileCriterionType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Charging_ Profile
 * urn:x-oca:ocpp:uid:2:233255
 * A ChargingProfile consists of ChargingSchedule, describing the amount of power or current that can be delivered per time interval.
 *
 */
export interface ChargingProfileCriterionType {
  customData?: CustomDataType | null;
  chargingProfilePurpose?: ChargingProfilePurposeEnumType | null;
  /**
   * Charging_ Profile. Stack_ Level. Counter
   * urn:x-oca:ocpp:uid:1:569230
   * Value determining level in hierarchy stack of profiles. Higher values have precedence over lower values. Lowest level is 0.
   *
   */
  stackLevel?: number | null;
  /**
   * List of all the chargingProfileIds requested. Any ChargingProfile that matches one of these profiles will be reported. If omitted, the Charging Station SHALL not filter on chargingProfileId. This field SHALL NOT contain more ids than set in &lt;&lt;configkey-charging-profile-entries,ChargingProfileEntries.maxLimit&gt;&gt;
   *
   *
   *
   * @minItems 1
   */
  chargingProfileId?: [number, ...number[]] | null;
  /**
   * For which charging limit sources, charging profiles SHALL be reported. If omitted, the Charging Station SHALL not filter on chargingLimitSource.
   *
   *
   * @minItems 1
   * @maxItems 4
   */
  chargingLimitSource?:
    | [ChargingLimitSourceEnumType]
    | [ChargingLimitSourceEnumType, ChargingLimitSourceEnumType]
    | [
        ChargingLimitSourceEnumType,
        ChargingLimitSourceEnumType,
        ChargingLimitSourceEnumType,
      ]
    | [
        ChargingLimitSourceEnumType,
        ChargingLimitSourceEnumType,
        ChargingLimitSourceEnumType,
        ChargingLimitSourceEnumType,
      ]
    | null;
}