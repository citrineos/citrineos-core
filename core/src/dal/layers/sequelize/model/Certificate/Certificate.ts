// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CertificateDto, CountryName, SignatureAlgorithm, TenantDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_Namespace } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Tenant } from '../Tenant.js';

@Table({
  indexes: [
    {
      unique: true,
      fields: ['tenantId', 'serialNumber', 'issuerName'],
      name: 'tenantId_serialNumber_issuerName',
    },
    {
      unique: true,
      fields: ['tenantId', 'certificateFileHash'],
      name: 'tenantId_certificateFileHash',
    },
  ],
})
export class Certificate extends Model implements CertificateDto {
  static readonly MODEL_NAME: string = OCPP2_Namespace.Certificate;

  /**
   * Fields
   */
  // use serialNumber and issuerName as unique constraint based on 4.1.2.2 in https://www.rfc-editor.org/rfc/rfc5280
  @Column(DataType.BIGINT)
  declare serialNumber: number;

  @Column(DataType.STRING)
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
  declare signatureAlgorithm?: SignatureAlgorithm | null;

  @Column(DataType.STRING)
  declare countryName?: CountryName | null;

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
  declare certificateFileHash?: string | null;

  @Column(DataType.STRING)
  declare privateKeyFileId?: string | null;

  @ForeignKey(() => Certificate)
  @Column(DataType.INTEGER)
  declare signedBy?: number | null; // certificate id

  @BelongsTo(() => Certificate, { foreignKey: 'signedBy', as: 'signingCertificate' })
  declare signingCertificate?: Certificate;

  @HasMany(() => Certificate, { foreignKey: 'signedBy', as: 'signedCertificates' })
  declare signedCertificates?: Certificate[];

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: Certificate) {
    if (instance.tenantId == null) {
      instance.tenantId = DEFAULT_TENANT_ID;
    }
  }

  constructor(...args: any[]) {
    super(...args);
    if (this.tenantId == null) {
      this.tenantId = DEFAULT_TENANT_ID;
    }
  }
}
