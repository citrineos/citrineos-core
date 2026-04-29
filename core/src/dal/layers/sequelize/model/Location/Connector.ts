// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ChargingStationDto,
  ConnectorDto,
  ConnectorErrorCodeEnumType,
  ConnectorFormatEnumType,
  ConnectorPowerTypeEnumType,
  ConnectorStatusEnumType,
  ConnectorTypeEnumType,
  EvseDto,
  EvseTypeDto,
  MeterValueDto,
  StartTransactionDto,
  StatusNotificationDto,
  TariffDto,
  TenantDto,
  TransactionDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP1_6_Namespace } from '@citrineos/base';
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
import { EvseType } from '../DeviceModel/EvseType.js';
import { Tariff } from '../Tariff/Tariffs.js';
import { Tenant } from '../Tenant.js';
import { MeterValue } from '../TransactionEvent/MeterValue.js';
import { StartTransaction } from '../TransactionEvent/StartTransaction.js';
import { Transaction } from '../TransactionEvent/Transaction.js';
import { ChargingStation } from './ChargingStation.js';
import { Evse } from './Evse.js';
import { StatusNotification } from './StatusNotification.js';

@Table
export class Connector extends Model implements ConnectorDto {
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

  @ForeignKey(() => EvseType)
  @Column({
    unique: 'evseId_evseTypeConnectorId',
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare evseTypeConnectorId?: number; // This is the serial int starting at 1 used in OCPP 2.0.1 to refer to the connector, unique per EVSE.

  @Column({
    type: DataType.STRING,
    defaultValue: 'Unknown',
  })
  declare status: ConnectorStatusEnumType;

  @Column(DataType.STRING)
  declare type?: ConnectorTypeEnumType | null;

  @Column(DataType.STRING)
  declare format?: ConnectorFormatEnumType | null;

  @Column({
    type: DataType.STRING,
    defaultValue: 'NoError',
  })
  declare errorCode: ConnectorErrorCodeEnumType;

  @Column(DataType.STRING)
  declare powerType?: ConnectorPowerTypeEnumType | null;

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

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation?: ChargingStationDto;

  @BelongsTo(() => Evse, 'evseId')
  declare evse?: EvseDto;

  @BelongsTo(() => EvseType, 'evseTypeConnectorId')
  declare evseTypeByConnector?: EvseTypeDto;

  @HasMany(() => EvseType, 'connectorId')
  declare evseTypes?: EvseTypeDto[];

  @ForeignKey(() => Tariff)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  declare tariffId?: number | null;

  @BelongsTo(() => Tariff, 'tariffId')
  declare tariff?: TariffDto | null;

  @HasMany(() => StatusNotification, 'connectorId')
  declare statusNotifications?: StatusNotificationDto[];

  @HasMany(() => MeterValue, 'connectorId')
  declare meterValues?: MeterValueDto[];

  @HasMany(() => Transaction, 'connectorId')
  declare transactions?: TransactionDto[];

  @HasMany(() => StartTransaction, 'connectorDatabaseId')
  declare startTransactions?: StartTransactionDto[];

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

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
