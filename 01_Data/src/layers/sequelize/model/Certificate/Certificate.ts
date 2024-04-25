// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { InstallCertificateUseEnumType, Namespace } from '@citrineos/base';
import { Column, DataType, Index, Model, Table } from 'sequelize-typescript';

@Table
export class Certificate extends Model {
  static readonly MODEL_NAME: string = Namespace.ChargerCertificate;

  /**
   * Fields
   */

  @Index
  @Column({
    type: DataType.STRING,
    unique: 'stationId_serialNumber',
  })
  declare stationId: string;

  @Column({
    type: DataType.STRING,
    unique: 'stationId_serialNumber',
  })
  declare serialNumber: string;

  // Extended fields from certificate generation
  @Column(DataType.STRING)
  declare certificateType?: InstallCertificateUseEnumType;

  @Column(DataType.INTEGER)
  declare keyLength?: number;

  @Column(DataType.STRING)
  declare organizationName?: string;

  @Column(DataType.STRING)
  declare commonName?: string;

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
}
