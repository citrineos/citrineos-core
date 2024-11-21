import { GetCertificateIdUseEnumType, HashAlgorithmEnumType, Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from '../Location';
import { Certificate } from './Certificate';

@Table
export class InstalledCertificate extends Model {
  static readonly MODEL_NAME: string = Namespace.InstalledCertificate;

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
  })
  declare stationId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare hashAlgorithm?: HashAlgorithmEnumType | undefined;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare issuerNameHash?: string | undefined;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare issuerKeyHash?: string | undefined;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare serialNumber?: string | undefined;

  @Column({
    type: DataType.ENUM('V2GRootCertificate', 'MORootCertificate', 'CSMSRootCertificate', 'V2GCertificateChain', 'ManufacturerRootCertificate'),
    allowNull: false,
  })
  declare certificateType: GetCertificateIdUseEnumType;

  @ForeignKey(() => Certificate)
  @Column(DataType.INTEGER)
  declare certificateId?: number | null;

  @BelongsTo(() => Certificate)
  certificate!: Certificate;
}
