// Copyright 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { AttributeEnumType, DataEnumType, MutabilityEnumType } from '../enums';
import { OcppRequest } from '../../..';

export interface NotifyReportRequest extends OcppRequest {
  customData?: CustomDataType | null;
  /**
   * The id of the GetReportRequest  or GetBaseReportRequest that requested this report
   *
   */
  requestId: number;
  /**
   * Timestamp of the moment this message was generated at the Charging Station.
   *
   */
  generatedAt: string;
  /**
   * @minItems 1
   */
  reportData?: [ReportDataType, ...ReportDataType[]] | null;
  /**
   * “to be continued” indicator. Indicates whether another part of the report follows in an upcoming notifyReportRequest message. Default value when omitted is false.
   *
   *
   */
  tbc?: boolean | null;
  /**
   * Sequence number of this message. First message starts at 0.
   *
   */
  seqNo: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to report components, variables and variable attributes and characteristics.
 *
 */
export interface ReportDataType {
  customData?: CustomDataType | null;
  component: ComponentType;
  variable: VariableType;
  /**
   * @minItems 1
   * @maxItems 4
   */
  variableAttribute:
    | [VariableAttributeType]
    | [VariableAttributeType, VariableAttributeType]
    | [VariableAttributeType, VariableAttributeType, VariableAttributeType]
    | [
        VariableAttributeType,
        VariableAttributeType,
        VariableAttributeType,
        VariableAttributeType,
      ];
  variableCharacteristics?: VariableCharacteristicsType | null;
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
 * Attribute data of a variable.
 *
 */
export interface VariableAttributeType {
  customData?: CustomDataType | null;
  type?: AttributeEnumType | null;
  /**
   * Value of the attribute. May only be omitted when mutability is set to 'WriteOnly'.
   *
   * The Configuration Variable &lt;&lt;configkey-reporting-value-size,ReportingValueSize&gt;&gt; can be used to limit GetVariableResult.attributeValue, VariableAttribute.value and EventData.actualValue. The max size of these values will always remain equal.
   *
   */
  value?: string | null;
  mutability?: MutabilityEnumType | null;
  /**
   * If true, value will be persistent across system reboots or power down. Default when omitted is false.
   *
   */
  persistent?: boolean | null;
  /**
   * If true, value that will never be changed by the Charging Station at runtime. Default when omitted is false.
   *
   */
  constant?: boolean | null;
}
/**
 * Fixed read-only parameters of a variable.
 *
 */
export interface VariableCharacteristicsType {
  customData?: CustomDataType | null;
  /**
   * Unit of the variable. When the transmitted value has a unit, this field SHALL be included.
   *
   */
  unit?: string | null;
  dataType: DataEnumType;
  /**
   * Minimum possible value of this variable.
   *
   */
  minLimit?: number | null;
  /**
   * Maximum possible value of this variable. When the datatype of this Variable is String, OptionList, SequenceList or MemberList, this field defines the maximum length of the (CSV) string.
   *
   */
  maxLimit?: number | null;
  /**
   * Allowed values when variable is Option/Member/SequenceList.
   *
   * * OptionList: The (Actual) Variable value must be a single value from the reported (CSV) enumeration list.
   *
   * * MemberList: The (Actual) Variable value  may be an (unordered) (sub-)set of the reported (CSV) valid values list.
   *
   * * SequenceList: The (Actual) Variable value  may be an ordered (priority, etc)  (sub-)set of the reported (CSV) valid values.
   *
   * This is a comma separated list.
   *
   * The Configuration Variable &lt;&lt;configkey-configuration-value-size,ConfigurationValueSize&gt;&gt; can be used to limit SetVariableData.attributeValue and VariableCharacteristics.valueList. The max size of these values will always remain equal.
   *
   *
   */
  valuesList?: string | null;
  /**
   * Flag indicating if this variable supports monitoring.
   *
   */
  supportsMonitoring: boolean;
}
