import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ChargingStation } from '../Location/index.js';
import { ChargingStationSequenceType, DEFAULT_TENANT_ID, ITenantDto } from '@citrineos/base';
import { Tenant } from '../Tenant.js';

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

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: ITenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: ChargingStationSequence) {
    if (instance.tenantId == null) {
      instance.tenantId = DEFAULT_TENANT_ID;
    }
  }

  constructor(...args: any[]) {
    super(...args);
    if (this.tenantId == null) {
      this.tenantId = DEFAULT_TENANT_ID;
    }
  }
}
