// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from '../..';

export interface ICertificateDto extends IBaseDto {
  id?: number;
  serialNumber: number;
  issuerName: string;
  organizationName: string;
  commonName: string;
  keyLength?: number | null;
  validBefore?: string | null;
  signatureAlgorithm?: any;
  countryName?: any;
  isCA?: boolean;
  pathLen?: number | null;
  certificateFileId?: string | null;
  privateKeyFileId?: string | null;
  signedBy?: string | null;
}

export interface INewCertificateRequestDto {
  keyLength?: number;
  organizationName: string;
  commonName: string;
  filePath?: string;
  selfSigned: boolean;
  countryName?: any;
  signatureAlgorithm?: any;
  pathLen?: number;
  validBefore: any;
}

export enum SignatureAlgorithmEnumType {
  RSA = 'SHA256withRSA',
  ECDSA = 'SHA256withECDSA',
}

export enum CountryNameEnumType {
  US = 'US',
}

export enum CertificateDtoProps {
  id = 'id',
  serialNumber = 'serialNumber',
  issuerName = 'issuerName',
  organizationName = 'organizationName',
  commonName = 'commonName',
  keyLength = 'keyLength',
  validBefore = 'validBefore',
  signatureAlgorithm = 'signatureAlgorithm',
  countryName = 'countryName',
  isCA = 'isCA',
  pathLen = 'pathLen',
  certificateFileId = 'certificateFileId',
  privateKeyFileId = 'privateKeyFileId',
  signedBy = 'signedBy',
}
