// Copyright 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { MessageFormatEnumType, MessagePriorityEnumType, MessageStateEnumType } from '../enums';
import { OcppRequest } from '../../../..';

export interface NotifyDisplayMessagesRequest extends OcppRequest {
  customData?: CustomDataType | null;
  /**
   * @minItems 1
   */
  messageInfo?: [MessageInfoType, ...MessageInfoType[]] | null;
  /**
   * The id of the &lt;&lt;getdisplaymessagesrequest,GetDisplayMessagesRequest&gt;&gt; that requested this message.
   *
   */
  requestId: number;
  /**
   * "to be continued" indicator. Indicates whether another part of the report follows in an upcoming NotifyDisplayMessagesRequest message. Default value when omitted is false.
   *
   */
  tbc?: boolean | null;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Message_ Info
 * urn:x-enexis:ecdm:uid:2:233264
 * Contains message details, for a message to be displayed on a Charging Station.
 *
 */
export interface MessageInfoType {
  customData?: CustomDataType | null;
  display?: ComponentType | null;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * Master resource identifier, unique within an exchange context. It is defined within the OCPP context as a positive Integer value (greater or equal to zero).
   *
   */
  id: number;
  priority: MessagePriorityEnumType;
  state?: MessageStateEnumType | null;
  /**
   * Message_ Info. Start. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569256
   * From what date-time should this message be shown. If omitted: directly.
   *
   */
  startDateTime?: string | null;
  /**
   * Message_ Info. End. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569257
   * Until what date-time should this message be shown, after this date/time this message SHALL be removed.
   *
   */
  endDateTime?: string | null;
  /**
   * During which transaction shall this message be shown.
   * Message SHALL be removed by the Charging Station after transaction has
   * ended.
   *
   */
  transactionId?: string | null;
  message: MessageContentType;
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
 * Message_ Content
 * urn:x-enexis:ecdm:uid:2:234490
 * Contains message details, for a message to be displayed on a Charging Station.
 *
 *
 */
export interface MessageContentType {
  customData?: CustomDataType | null;
  format: MessageFormatEnumType;
  /**
   * Message_ Content. Language. Language_ Code
   * urn:x-enexis:ecdm:uid:1:570849
   * Message language identifier. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   */
  language?: string | null;
  /**
   * Message_ Content. Content. Message
   * urn:x-enexis:ecdm:uid:1:570852
   * Message contents.
   *
   *
   */
  content: string;
}
