// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { CountryNameEnumType, SignatureAlgorithmEnumType } from './index';

@Table
export class Certificate extends Model {
  static readonly MODEL_NAME: string = Namespace.Certificate;

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
  declare keyLength?: number;

  @Column({
    type: DataType.DATE,
    get() {
      const validBefore: Date = this.getDataValue('validBefore');
      return validBefore ? validBefore.toISOString() : null;
    },
  })
  declare validBefore?: string;

  @Column(DataType.STRING)
  declare signatureAlgorithm?: SignatureAlgorithmEnumType;

  @Column(DataType.STRING)
  declare countryName?: CountryNameEnumType;

  @Column(DataType.BOOLEAN)
  declare isCA?: boolean;

  // A pathLenConstraint of zero indicates that no intermediate CA certificates may
  // follow in a valid certification path. Where it appears, the pathLenConstraint field MUST be greater than or
  // equal to zero. Where pathLenConstraint does not appear, no limit is imposed.
  // Reference: https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.9
  @Column(DataType.INTEGER)
  declare pathLen?: number;

  @Column(DataType.STRING)
  declare certificateFileId?: string;

  @Column(DataType.STRING)
  declare privateKeyFileId?: string;

  @Column(DataType.STRING)
  declare signedBy?: string; // certificate id
}
