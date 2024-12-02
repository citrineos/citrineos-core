// Copyright 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { GetCertificateIdUseEnumType } from '../enums';
import { OcppRequest } from '../../..';

export interface GetInstalledCertificateIdsRequest extends OcppRequest {
  customData?: CustomDataType | null;
  /**
   * Indicates the type of certificates requested. When omitted, all certificate types are requested.
   *
   *
   * @minItems 1
   */
  certificateType?:
    | [GetCertificateIdUseEnumType, ...GetCertificateIdUseEnumType[]]
    | null;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
