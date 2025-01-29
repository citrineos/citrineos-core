import { Column, Model, Table, DataType } from 'sequelize-typescript';
import { OCPP2_0_1_Namespace } from '@citrineos/base';

/**
 * Represents the security information found on a particular charging station.
 */
@Table
export class ChargingStationSecurityInfo extends Model {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.ChargingStationSecurityInfo;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  stationId!: string;

  // TODO: store public key information into the database
  // then reference here with foreign key. Transition to
  // using a foreign key by migrating current system config
  // into a database entry to store this information.
  @Column(DataType.STRING)
  publicKeyFileId!: string;
}
