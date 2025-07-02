import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { ChargingStation } from '../Location';
import { ChargingStationSequenceType } from '@citrineos/base';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class ChargingStationSequence extends BaseModelWithTenant {
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
