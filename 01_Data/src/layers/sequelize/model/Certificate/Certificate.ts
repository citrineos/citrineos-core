// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { InstallCertificateUseEnumType, Namespace } from '@citrineos/base';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class Certificate extends Model {
  static readonly MODEL_NAME: string = Namespace.Certificate;

  /**
   * Fields
   */
  @Column({
    type: DataType.STRING,
    unique: 'serialNumber_certificateType_organizationName_commonName',
  })
  declare serialNumber: string;

  @Column({
    type: DataType.STRING,
    unique: 'serialNumber_certificateType_organizationName_commonName',
  })
  declare certificateType: InstallCertificateUseEnumType;

  @Column({
    type: DataType.STRING,
    unique: 'serialNumber_certificateType_organizationName_commonName',
  })
  declare organizationName: string;

  @Column({
    type: DataType.STRING,
    unique: 'serialNumber_certificateType_organizationName_commonName',
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

  @Column(DataType.STRING)
  declare certificateFileId?: string;

  @Column(DataType.STRING)
  declare privateKeyFileId?: string;

  @Column(DataType.STRING)
  declare signedBy?: string; // certificate id
}
