// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { CountryNameEnumType, SignatureAlgorithmEnumType } from '../../models/certificate/index.js';

// Determines how much of the chain is generated: `Leaf` reuses the current
// root+subCA and is the default when omitted (throws if they don't already
// exist), `SubCAAndLeaf` reuses the current root, `FullChain` generates
// everything.
export enum CertificateGenerationScope {
  Leaf = 'Leaf',
  SubCAAndLeaf = 'SubCAAndLeaf',
  FullChain = 'FullChain',
}

export class GenerateCertificateChainRequest {
  // Fields for generating a certificate
  // Refer to 1.4.1. Certificate Properties in OCPP 2.0.1 Part 2
  // Only needed when generationScope is FullChain; defaults to true when omitted.
  selfSigned?: boolean;
  organizationName: string;
  commonName: string;
  keyLength?: number;
  validBefore?: string;
  countryName?: CountryNameEnumType;
  signatureAlgorithm?: SignatureAlgorithmEnumType;
  pathLen?: number;
  // The file path to store the generated certificate.
  filePath?: string;
  generationScope?: CertificateGenerationScope;
  // Only relevant when generationScope is FullChain and a root is actually generated.
  // When true (the default), the new root is signed by the previous root.
  signWithPreviousRoot?: boolean;
  // File path of a specific root certificate to sign the new
  // root with, overriding whichever root would otherwise be used by default.
  overridePreviousRoot?: string;

  constructor(
    organizationName: string,
    commonName: string,
    selfSigned?: boolean,
    keyLength?: number,
    validBefore?: string,
    countryName?: CountryNameEnumType,
    signatureAlgorithm?: SignatureAlgorithmEnumType,
    pathLen?: number,
    filePath?: string,
    generationScope?: CertificateGenerationScope,
    signWithPreviousRoot?: boolean,
    overridePreviousRoot?: string,
  ) {
    this.selfSigned = selfSigned;
    this.organizationName = organizationName;
    this.commonName = commonName;
    this.keyLength = keyLength;
    this.validBefore = validBefore;
    this.countryName = countryName;
    this.signatureAlgorithm = signatureAlgorithm;
    this.pathLen = pathLen;
    this.filePath = filePath;
    this.generationScope = generationScope;
    this.signWithPreviousRoot = signWithPreviousRoot;
    this.overridePreviousRoot = overridePreviousRoot;
  }
}
