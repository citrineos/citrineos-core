import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from '../Location';
import { ChargingStationSequenceType } from '@citrineos/base';

@Table
export class ChargingStationSequence extends Model {
  static readonly MODEL_NAME: string = 'ChargingStationSequence';

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    unique: 'stationId_type',
  })
  declare stationId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: 'stationId_type',
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
