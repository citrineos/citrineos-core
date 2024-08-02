import { Column, Model, Table, DataType, ForeignKey } from 'sequelize-typescript';
import { PublicKeyInfo } from './PublicKeyInfo';

/**
 * Represents the security information found on a particular charging station
 */
@Table
export class ChargingStationSecurityInfo extends Model { // TODO a better name
  @Column({
    type: DataType.STRING,
    unique: true
  })
  stationId!: string;

  @ForeignKey(() => PublicKeyInfo)
  @Column(DataType.INTEGER)
  publicKeyId!: number;
}
