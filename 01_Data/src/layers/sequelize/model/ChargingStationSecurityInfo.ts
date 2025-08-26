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
import { DEFAULT_TENANT_ID, ITenantDto, OCPP2_0_1_Namespace } from '@citrineos/base';
import { Tenant } from './Tenant.js';

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
  static setDefaultTenant(instance: ChargingStationSecurityInfo) {
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
