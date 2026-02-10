import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Certificate } from './Certificate.js';
import { OCPP2_0_1_Namespace } from '@citrineos/base/src/ocpp/persistence/namespace.js';
import { ChargingStation } from '../Location/index.js';
import { OCPP2_0_1 } from '@citrineos/base';

@Table
export class InstallCertificateAttempt extends Model {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.InstallCertificateAttempt;

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
  })
  declare stationId: string;

  @BelongsTo(() => ChargingStation)
  station?: ChargingStation;

  @Column({
    type: DataType.ENUM(
      'V2GRootCertificate',
      'MORootCertificate',
      'CSMSRootCertificate',
      'V2GCertificateChain',
      'ManufacturerRootCertificate',
    ),
    allowNull: false,
  })
  declare certificateType: OCPP2_0_1.GetCertificateIdUseEnumType;

  @ForeignKey(() => Certificate)
  @Column(DataType.INTEGER)
  declare certificateId: number;

  @BelongsTo(() => Certificate)
  certificate?: Certificate;

  @Column({
    type: DataType.ENUM('Accepted', 'Rejected', 'Failed'),
    allowNull: true,
  })
  declare status?: OCPP2_0_1.InstallCertificateStatusEnumType | null;
}
