// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

 
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { HashAlgorithmEnumType } from '../enums';
import { OcppRequest } from '../../..';

export interface DeleteCertificateRequest extends OcppRequest {
  customData?: CustomDataType | null;
  certificateHashData: CertificateHashDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
export interface CertificateHashDataType {
  customData?: CustomDataType | null;
  hashAlgorithm: HashAlgorithmEnumType;
  /**
   * Hashed value of the Issuer DN (Distinguished Name).
   *
   *
   */
  issuerNameHash: string;
  /**
   * Hashed value of the issuers public key
   *
   */
  issuerKeyHash: string;
  /**
   * The serial number of the certificate.
   *
   */
  serialNumber: string;
}
