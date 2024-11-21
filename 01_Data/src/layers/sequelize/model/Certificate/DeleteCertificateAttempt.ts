import { DeleteCertificateStatusEnumType, HashAlgorithmEnumType, Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from '../Location';

@Table
export class DeleteCertificateAttempt extends Model {
  static readonly MODEL_NAME: string = Namespace.DeleteCertificateAttempt;

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
  })
  declare stationId: string;

  @BelongsTo(() => ChargingStation)
  station?: ChargingStation;

  @Column({
    type: DataType.ENUM('SHA256', 'SHA384', 'SHA512'),
    allowNull: false,
  })
  declare hashAlgorithm: HashAlgorithmEnumType;

  @Column(DataType.STRING)
  declare issuerNameHash: string;

  @Column(DataType.STRING)
  declare issuerKeyHash: string;

  @Column(DataType.STRING)
  declare serialNumber: string;

  @Column({
    type: DataType.ENUM('Accepted', 'Failed', 'NotFound'),
    allowNull: true,
  })
  declare status?: DeleteCertificateStatusEnumType | null;
}
