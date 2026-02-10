import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import { ChargingStation } from '../Location/index.js';

@Table
export class DeleteCertificateAttempt extends Model {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.DeleteCertificateAttempt;

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
  declare hashAlgorithm: OCPP2_0_1.HashAlgorithmEnumType;

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
  declare status?: OCPP2_0_1.DeleteCertificateStatusEnumType | null;
}
