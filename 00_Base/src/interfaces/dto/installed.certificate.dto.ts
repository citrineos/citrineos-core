// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto } from '../..';

export interface IInstalledCertificateDto extends IBaseDto {
  id?: number;
  stationId: string;
  hashAlgorithm: any;
  issuerNameHash: string;
  issuerKeyHash: string;
  serialNumber: string;
  certificateType: any;
}
export enum InstalledCertificateDtoProps {
  id = 'id',
  stationId = 'stationId',
  hashAlgorithm = 'hashAlgorithm',
  issuerNameHash = 'issuerNameHash',
  issuerKeyHash = 'issuerKeyHash',
  serialNumber = 'serialNumber',
  certificateType = 'certificateType',
}
