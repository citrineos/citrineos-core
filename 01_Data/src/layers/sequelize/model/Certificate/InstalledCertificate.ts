import { GetCertificateIdUseEnumType, Namespace } from '@citrineos/base';
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from '../Location';

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
    allowNull: false,
  })
  declare hashAlgorithm: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare issuerNameHash: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare issuerKeyHash: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare serialNumber: string;

  @Column({
    type: DataType.ENUM('V2GRootCertificate', 'MORootCertificate', 'CSMSRootCertificate', 'V2GCertificateChain', 'ManufacturerRootCertificate'),
    allowNull: false,
  })
  declare certificateType: GetCertificateIdUseEnumType;

  constructor(stationId: string, hashAlgorithm: string, issuerNameHash: string, issuerKeyHash: string, serialNumber: string, certificateType: GetCertificateIdUseEnumType) {
    super();
    this.stationId = stationId;
    this.hashAlgorithm = hashAlgorithm;
    this.issuerNameHash = issuerNameHash;
    this.issuerKeyHash = issuerKeyHash;
    this.serialNumber = serialNumber;
    this.certificateType = certificateType;
  }
}
