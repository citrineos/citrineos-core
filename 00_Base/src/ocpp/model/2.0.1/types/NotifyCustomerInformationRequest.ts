// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { OcppRequest } from '../../..';

export interface NotifyCustomerInformationRequest extends OcppRequest {
  customData?: CustomDataType | null;
  /**
   * (Part of) the requested data. No format specified in which the data is returned. Should be human readable.
   *
   */
  data: string;
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
   *  Timestamp of the moment this message was generated at the Charging Station.
   *
   */
  generatedAt: string;
  /**
   * The Id of the request.
   *
   *
   */
  requestId: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
