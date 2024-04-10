// Copyright 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { LogEnumType } from '../enums';
import { OcppRequest } from '../../..';

export interface GetLogRequest extends OcppRequest {
  customData?: CustomDataType;
  log: LogParametersType;
  logType: LogEnumType;
  /**
   * The Id of this request
   *
   */
  requestId: number;
  /**
   * This specifies how many times the Charging Station must try to upload the log before giving up. If this field is not present, it is left to Charging Station to decide how many times it wants to retry.
   *
   */
  retries?: number;
  /**
   * The interval in seconds after which a retry may be attempted. If this field is not present, it is left to Charging Station to decide how long to wait between attempts.
   *
   */
  retryInterval?: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Log
 * urn:x-enexis:ecdm:uid:2:233373
 * Generic class for the configuration of logging entries.
 *
 */
export interface LogParametersType {
  customData?: CustomDataType;
  /**
   * Log. Remote_ Location. URI
   * urn:x-enexis:ecdm:uid:1:569484
   * The URL of the location at the remote system where the log should be stored.
   *
   */
  remoteLocation: string;
  /**
   * Log. Oldest_ Timestamp. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569477
   * This contains the date and time of the oldest logging information to include in the diagnostics.
   *
   */
  oldestTimestamp?: string;
  /**
   * Log. Latest_ Timestamp. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569482
   * This contains the date and time of the latest logging information to include in the diagnostics.
   *
   */
  latestTimestamp?: string;
}


