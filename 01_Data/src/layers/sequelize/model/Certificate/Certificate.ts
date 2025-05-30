// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1_Namespace } from '@citrineos/base';
import { Column, DataType, Table } from 'sequelize-typescript';
import { CountryNameEnumType, SignatureAlgorithmEnumType } from './index';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class Certificate extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.Certificate;

  /**
   * Fields
   */
  // use serialNumber and issuerName as unique constraint based on 4.1.2.2 in https://www.rfc-editor.org/rfc/rfc5280
  @Column({
    type: DataType.BIGINT,
    unique: 'serialNumber_issuerName',
  })
  declare serialNumber: number;

  @Column({
    type: DataType.STRING,
    unique: 'serialNumber_issuerName',
  })
  declare issuerName: string;

  @Column(DataType.STRING)
  declare organizationName: string;

  @Column(DataType.STRING)
  declare commonName: string;

  @Column(DataType.INTEGER)
  declare keyLength?: number | null;

  @Column({
    type: DataType.DATE,
    get() {
      const validBefore: Date = this.getDataValue('validBefore');
      return validBefore ? validBefore.toISOString() : null;
    },
  })
  declare validBefore?: string | null;

  @Column(DataType.STRING)
  declare signatureAlgorithm?: SignatureAlgorithmEnumType | null;

  @Column(DataType.STRING)
  declare countryName?: CountryNameEnumType | null;

  @Column(DataType.BOOLEAN)
  declare isCA?: boolean;

  // A pathLenConstraint of zero indicates that no intermediate CA certificates may
  // follow in a valid certification path. Where it appears, the pathLenConstraint field MUST be greater than or
  // equal to zero. Where pathLenConstraint does not appear, no limit is imposed.
  // Reference: https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.9
  @Column(DataType.INTEGER)
  declare pathLen?: number | null;

  @Column(DataType.STRING)
  declare certificateFileId?: string | null;

  @Column(DataType.STRING)
  declare privateKeyFileId?: string | null;

  @Column(DataType.STRING)
  declare signedBy?: string | null; // certificate id
}
