// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

 
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { ChargingRateUnitEnumType, GenericStatusEnumType } from '../enums';
import { OcppResponse } from '../../..';

export interface GetCompositeScheduleResponse extends OcppResponse {
  customData?: CustomDataType | null;
  status: GenericStatusEnumType;
  statusInfo?: StatusInfoType | null;
  schedule?: CompositeScheduleType | null;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType | null;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string | null;
}
/**
 * Composite_ Schedule
 * urn:x-oca:ocpp:uid:2:233362
 *
 */
export interface CompositeScheduleType {
  customData?: CustomDataType | null;
  /**
   * @minItems 1
   */
  chargingSchedulePeriod: [
    ChargingSchedulePeriodType,
    ...ChargingSchedulePeriodType[],
  ];
  /**
   * The ID of the EVSE for which the
   * schedule is requested. When evseid=0, the
   * Charging Station calculated the expected
   * consumption for the grid connection.
   *
   */
  evseId: number;
  /**
   * Duration of the schedule in seconds.
   *
   */
  duration: number;
  /**
   * Composite_ Schedule. Start. Date_ Time
   * urn:x-oca:ocpp:uid:1:569456
   * Date and time at which the schedule becomes active. All time measurements within the schedule are relative to this timestamp.
   *
   */
  scheduleStart: string;
  chargingRateUnit: ChargingRateUnitEnumType;
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
