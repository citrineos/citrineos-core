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
  @Column({
    type: DataType.BIGINT,
    unique: 'serialNumber_organizationName_commonName',
  })
  declare serialNumber: number;

  @Column({
    type: DataType.STRING,
    unique: 'serialNumber_organizationName_commonName',
  })
  declare organizationName: string;

  @Column({
    type: DataType.STRING,
    unique: 'serialNumber_organizationName_commonName',
  })
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

  @Column
  declare signatureAlgorithm?: SignatureAlgorithmEnumType;

  @Column
  declare countryName?: CountryNameEnumType;

  @Column
  declare isCA?: boolean;

  // A pathLenConstraint of zero indicates that no intermediate CA certificates may
  // follow in a valid certification path. Where it appears, the pathLenConstraint field MUST be greater than or
  // equal to zero. Where pathLenConstraint does not appear, no limit is imposed.
  // Reference: https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.9
  @Column
  declare pathLen?: number;

  @Column(DataType.STRING)
  declare certificateFileId?: string;

  @Column(DataType.STRING)
  declare privateKeyFileId?: string;

  @Column(DataType.STRING)
  declare signedBy?: string; // certificate id
}
