// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IChargingStationDto, IConnectorDto, ITenantDto } from '@citrineos/base';
import {
  ConnectorErrorCode,
  ConnectorFormatEnum,
  ConnectorPowerType,
  ConnectorStatus,
  ConnectorTypeEnum,
  DEFAULT_TENANT_ID,
  OCPP1_6_Namespace,
} from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { ChargingStation } from './ChargingStation.js';
import { Evse } from './Evse.js';
import { Tariff } from '../Tariff/index.js';
import { Tenant } from '../Tenant.js';

@Table
export class Connector extends Model implements IConnectorDto {
  static readonly MODEL_NAME: string = OCPP1_6_Namespace.Connector;

  @ForeignKey(() => ChargingStation)
  @Column({
    unique: 'stationId_connectorId',
    allowNull: false,
    type: DataType.STRING,
  })
  declare stationId: string;

  @ForeignKey(() => Evse)
  @Column({
    unique: 'evseId_evseTypeConnectorId',
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare evseId: number;

  @Column({
    unique: 'stationId_connectorId',
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare connectorId: number; // This is the serial int starting at 1 used in OCPP 1.6 to refer to the connector, unique per Charging Station.

  @Column({
    unique: 'evseId_evseTypeConnectorId',
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare evseTypeConnectorId?: number; // This is the serial int starting at 1 used in OCPP 2.0.1 to refer to the connector, unique per EVSE.

  @Column({
    type: DataType.STRING,
    defaultValue: ConnectorStatus.Unknown,
  })
  declare status: ConnectorStatus;

  @Column(DataType.STRING)
  declare type?: ConnectorTypeEnum | null;

  @Column(DataType.STRING)
  declare format?: ConnectorFormatEnum | null;

  @Column({
    type: DataType.STRING,
    defaultValue: ConnectorErrorCode.NoError,
  })
  declare errorCode: ConnectorErrorCode;

  @Column(DataType.STRING)
  declare powerType?: ConnectorPowerType | null;

  @Column(DataType.INTEGER)
  declare maximumAmperage?: number | null;

  @Column(DataType.INTEGER)
  declare maximumVoltage?: number | null;

  @Column(DataType.INTEGER)
  declare maximumPowerWatts?: number | null;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  @Column(DataType.STRING)
  declare info?: string | null;

  @Column(DataType.STRING)
  declare vendorId?: string | null;

  @Column(DataType.STRING)
  declare vendorErrorCode?: string | null;

  @Column(DataType.STRING)
  declare termsAndConditionsUrl?: string | null;

  @BelongsTo(() => ChargingStation)
  declare chargingStation?: IChargingStationDto;

  @BelongsTo(() => Evse)
  declare evse?: Evse;

  @HasMany(() => Tariff)
  declare tariffs?: Tariff[];

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
  static setDefaultTenant(instance: Connector) {
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
