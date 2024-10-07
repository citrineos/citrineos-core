import { BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { ChargingStation } from '../Location';

export type ChargingStationSequenceType = 'remoteStartId' | 'getDisplayMessages' | 'getChargingProfiles' | 'getMonitoringReport';

@Table({
  timestamps: false,
})
export class ChargingStationSequence extends Model {
  static readonly MODEL_NAME: string = 'ChargingStationSequence';

  @PrimaryKey
  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
  })
  declare stationId: string;

  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  type!: ChargingStationSequenceType;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    defaultValue: 0,
  })
  value!: number;

  @BelongsTo(() => ChargingStation)
  declare station: ChargingStation;
}
