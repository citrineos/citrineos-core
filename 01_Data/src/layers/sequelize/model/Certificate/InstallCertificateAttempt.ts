import { GetCertificateIdUseEnumType, InstallCertificateStatusEnumType, Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from '../Location';
import { Certificate } from './Certificate';

@Table
export class InstallCertificateAttempt extends Model {
  static readonly MODEL_NAME: string = Namespace.InstallCertificateAttempt;

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
  })
  declare stationId: string;

  @BelongsTo(() => ChargingStation)
  station?: ChargingStation;

  @Column({
    type: DataType.ENUM('V2GRootCertificate', 'MORootCertificate', 'CSMSRootCertificate', 'V2GCertificateChain', 'ManufacturerRootCertificate'),
    allowNull: false,
  })
  declare certificateType: GetCertificateIdUseEnumType;

  @ForeignKey(() => Certificate)
  @Column(DataType.INTEGER)
  declare certificateId: number;

  @BelongsTo(() => Certificate)
  certificate?: Certificate;

  @Column({
    type: DataType.ENUM('Accepted', 'Rejected', 'Failed'),
    allowNull: true,
  })
  declare status?: InstallCertificateStatusEnumType | null;
}
