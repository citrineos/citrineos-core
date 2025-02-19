import { OCPP2_0_1_Namespace, OCPP2_0_1 } from '@citrineos/base';
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from '../Location';

@Table
export class InstalledCertificate extends Model implements OCPP2_0_1.CertificateHashDataType {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.InstalledCertificate;

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
  declare hashAlgorithm: OCPP2_0_1.HashAlgorithmEnumType;

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
  declare certificateType: OCPP2_0_1.GetCertificateIdUseEnumType;
}
