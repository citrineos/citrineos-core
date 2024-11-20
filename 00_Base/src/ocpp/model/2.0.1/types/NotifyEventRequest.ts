// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

 
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { EventNotificationEnumType, EventTriggerEnumType } from '../enums';
import { OcppRequest } from '../../..';

export interface NotifyEventRequest extends OcppRequest {
  customData?: CustomDataType | null;
  /**
   * Timestamp of the moment this message was generated at the Charging Station.
   *
   */
  generatedAt: string;
  /**
   * “to be continued” indicator. Indicates whether another part of the report follows in an upcoming notifyEventRequest message. Default value when omitted is false.
   *
   */
  tbc?: boolean | null;
  /**
   * Sequence number of this message. First message starts at 0.
   *
   */
  seqNo: number;
  /**
   * @minItems 1
   */
  eventData: [EventDataType, ...EventDataType[]];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to report an event notification for a component-variable.
 *
 */
export interface EventDataType {
  customData?: CustomDataType | null;
  /**
   * Identifies the event. This field can be referred to as a cause by other events.
   *
   *
   */
  eventId: number;
  /**
   * Timestamp of the moment the report was generated.
   *
   */
  timestamp: string;
  trigger: EventTriggerEnumType;
  /**
   * Refers to the Id of an event that is considered to be the cause for this event.
   *
   *
   */
  cause?: number | null;
  /**
   * Actual value (_attributeType_ Actual) of the variable.
   *
   * The Configuration Variable &lt;&lt;configkey-reporting-value-size,ReportingValueSize&gt;&gt; can be used to limit GetVariableResult.attributeValue, VariableAttribute.value and EventData.actualValue. The max size of these values will always remain equal.
   *
   *
   */
  actualValue: string;
  /**
   * Technical (error) code as reported by component.
   *
   */
  techCode?: string | null;
  /**
   * Technical detail information as reported by component.
   *
   */
  techInfo?: string | null;
  /**
   * _Cleared_ is set to true to report the clearing of a monitored situation, i.e. a 'return to normal'.
   *
   *
   */
  cleared?: boolean | null;
  /**
   * If an event notification is linked to a specific transaction, this field can be used to specify its transactionId.
   *
   */
  transactionId?: string | null;
  component: ComponentType;
  /**
   * Identifies the VariableMonitoring which triggered the event.
   *
   */
  variableMonitoringId?: number | null;
  eventNotificationType: EventNotificationEnumType;
  variable: VariableType;
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
