// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

 
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { MonitorEnumType } from '../enums';
import { OcppRequest } from '../../../..';

export interface NotifyMonitoringReportRequest extends OcppRequest {
  customData?: CustomDataType | null;
  /**
   * @minItems 1
   */
  monitor?: [MonitoringDataType, ...MonitoringDataType[]] | null;
  /**
   * The id of the GetMonitoringRequest that requested this report.
   *
   *
   */
  requestId: number;
  /**
   * “to be continued” indicator. Indicates whether another part of the monitoringData follows in an upcoming notifyMonitoringReportRequest message. Default value when omitted is false.
   *
   */
  tbc?: boolean | null;
  /**
   * Sequence number of this message. First message starts at 0.
   *
   */
  seqNo: number;
  /**
   * Timestamp of the moment this message was generated at the Charging Station.
   *
   */
  generatedAt: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to hold parameters of SetVariableMonitoring request.
 *
 */
export interface MonitoringDataType {
  customData?: CustomDataType | null;
  component: ComponentType;
  variable: VariableType;
  /**
   * @minItems 1
   */
  variableMonitoring: [VariableMonitoringType, ...VariableMonitoringType[]];
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType | null;
  evse?: EVSEType | null;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string | null;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType | null;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number | null;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType | null;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string | null;
}
/**
 * A monitoring setting for a variable.
 *
 */
export interface VariableMonitoringType {
  customData?: CustomDataType | null;
  /**
   * Identifies the monitor.
   *
   */
  id: number;
  /**
   * Monitor only active when a transaction is ongoing on a component relevant to this transaction.
   *
   */
  transaction: boolean;
  /**
   * Value for threshold or delta monitoring.
   * For Periodic or PeriodicClockAligned this is the interval in seconds.
   *
   */
  value: number;
  type: MonitorEnumType;
  /**
   * The severity that will be assigned to an event that is triggered by this monitor. The severity range is 0-9, with 0 as the highest and 9 as the lowest severity level.
   *
   * The severity levels have the following meaning: +
   * *0-Danger* +
   * Indicates lives are potentially in danger. Urgent attention is needed and action should be taken immediately. +
   * *1-Hardware Failure* +
   * Indicates that the Charging Station is unable to continue regular operations due to Hardware issues. Action is required. +
   * *2-System Failure* +
   * Indicates that the Charging Station is unable to continue regular operations due to software or minor hardware issues. Action is required. +
   * *3-Critical* +
   * Indicates a critical error. Action is required. +
   * *4-Error* +
   * Indicates a non-urgent error. Action is required. +
   * *5-Alert* +
   * Indicates an alert event. Default severity for any type of monitoring event.  +
   * *6-Warning* +
   * Indicates a warning event. Action may be required. +
   * *7-Notice* +
   * Indicates an unusual event. No immediate action is required. +
   * *8-Informational* +
   * Indicates a regular operational event. May be used for reporting, measuring throughput, etc. No action is required. +
   * *9-Debug* +
   * Indicates information useful to developers for debugging, not useful during operations.
   *
   */
  severity: number;
}
