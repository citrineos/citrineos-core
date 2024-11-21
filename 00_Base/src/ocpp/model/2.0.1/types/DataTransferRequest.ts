// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

 
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { OcppRequest } from '../../../..';

export interface DataTransferRequest extends OcppRequest {
  customData?: CustomDataType | null;
  /**
   * May be used to indicate a specific message or implementation.
   *
   */
  messageId?: string | null;
  /**
   * Data without specified length or format. This needs to be decided by both parties (Open to implementation).
   *
   */
  data?: {
    [k: string]: unknown | null;
  };
  /**
   * This identifies the Vendor specific implementation
   *
   *
   */
  vendorId: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}