// Copyright 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

 
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { EnergyTransferModeEnumType } from '../enums';
import { OcppRequest } from '../../..';

export interface NotifyEVChargingNeedsRequest extends OcppRequest {
  customData?: CustomDataType | null;
  /**
   * Contains the maximum schedule tuples the car supports per schedule.
   *
   */
  maxScheduleTuples?: number | null;
  chargingNeeds: ChargingNeedsType;
  /**
   * Defines the EVSE and connector to which the EV is connected. EvseId may not be 0.
   *
   */
  evseId: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Charging_ Needs
 * urn:x-oca:ocpp:uid:2:233249
 *
 */
export interface ChargingNeedsType {
  customData?: CustomDataType | null;
  acChargingParameters?: ACChargingParametersType | null;
  dcChargingParameters?: DCChargingParametersType | null;
  requestedEnergyTransfer: EnergyTransferModeEnumType;
  /**
   * Charging_ Needs. Departure_ Time. Date_ Time
   * urn:x-oca:ocpp:uid:1:569223
   * Estimated departure time of the EV.
   *
   */
  departureTime?: string | null;
}
/**
 * AC_ Charging_ Parameters
 * urn:x-oca:ocpp:uid:2:233250
 * EV AC charging parameters.
 *
 *
 */
export interface ACChargingParametersType {
  customData?: CustomDataType | null;
  /**
   * AC_ Charging_ Parameters. Energy_ Amount. Energy_ Amount
   * urn:x-oca:ocpp:uid:1:569211
   * Amount of energy requested (in Wh). This includes energy required for preconditioning.
   *
   */
  energyAmount: number;
  /**
   * AC_ Charging_ Parameters. EV_ Min. Current
   * urn:x-oca:ocpp:uid:1:569212
   * Minimum current (amps) supported by the electric vehicle (per phase).
   *
   */
  evMinCurrent: number;
  /**
   * AC_ Charging_ Parameters. EV_ Max. Current
   * urn:x-oca:ocpp:uid:1:569213
   * Maximum current (amps) supported by the electric vehicle (per phase). Includes cable capacity.
   *
   */
  evMaxCurrent: number;
  /**
   * AC_ Charging_ Parameters. EV_ Max. Voltage
   * urn:x-oca:ocpp:uid:1:569214
   * Maximum voltage supported by the electric vehicle
   *
   */
  evMaxVoltage: number;
}
/**
 * DC_ Charging_ Parameters
 * urn:x-oca:ocpp:uid:2:233251
 * EV DC charging parameters
 *
 *
 *
 */
export interface DCChargingParametersType {
  customData?: CustomDataType | null;
  /**
   * DC_ Charging_ Parameters. EV_ Max. Current
   * urn:x-oca:ocpp:uid:1:569215
   * Maximum current (amps) supported by the electric vehicle. Includes cable capacity.
   *
   */
  evMaxCurrent: number;
  /**
   * DC_ Charging_ Parameters. EV_ Max. Voltage
   * urn:x-oca:ocpp:uid:1:569216
   * Maximum voltage supported by the electric vehicle
   *
   */
  evMaxVoltage: number;
  /**
   * DC_ Charging_ Parameters. Energy_ Amount. Energy_ Amount
   * urn:x-oca:ocpp:uid:1:569217
   * Amount of energy requested (in Wh). This inludes energy required for preconditioning.
   *
   */
  energyAmount?: number | null;
  /**
   * DC_ Charging_ Parameters. EV_ Max. Power
   * urn:x-oca:ocpp:uid:1:569218
   * Maximum power (in W) supported by the electric vehicle. Required for DC charging.
   *
   */
  evMaxPower?: number | null;
  /**
   * DC_ Charging_ Parameters. State_ Of_ Charge. Numeric
   * urn:x-oca:ocpp:uid:1:569219
   * Energy available in the battery (in percent of the battery capacity)
   *
   */
  stateOfCharge?: number | null;
  /**
   * DC_ Charging_ Parameters. EV_ Energy_ Capacity. Numeric
   * urn:x-oca:ocpp:uid:1:569220
   * Capacity of the electric vehicle battery (in Wh)
   *
   */
  evEnergyCapacity?: number | null;
  /**
   * DC_ Charging_ Parameters. Full_ SOC. Percentage
   * urn:x-oca:ocpp:uid:1:569221
   * Percentage of SoC at which the EV considers the battery fully charged. (possible values: 0 - 100)
   *
   */
  fullSoC?: number | null;
  /**
   * DC_ Charging_ Parameters. Bulk_ SOC. Percentage
   * urn:x-oca:ocpp:uid:1:569222
   * Percentage of SoC at which the EV considers a fast charging process to end. (possible values: 0 - 100)
   *
   */
  bulkSoC?: number | null;
}
