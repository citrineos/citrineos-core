// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AuthorizationDto,
  ChargingNeedsDto,
  ChargingStationDto,
  ConnectorDto,
  EvseDto,
  LocationDto,
  MeterValueDto,
  StartTransactionDto,
  StopTransactionDto,
  TariffDto,
  TenantDto,
  TransactionDto,
  TransactionEventDto,
  TransactionLimit,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { Authorization } from '../authorization/authorization.js';
import { ChargingStation } from '../location/charging-station.js';
import { Tariff } from '../tariff/tariffs.js';
// keep the direct import to avoid circular dependency
import { Connector } from '../location/connector.js';
import { Evse } from '../location/evse.js';
import { Location } from '../location/location.js';
import { Tenant } from '../tenant.js';

import { ChargingNeeds } from '../charging-profile/charging-needs.js';
import { MeterValue } from './meter-value.js';
import { StartTransaction } from './start-transaction.js';
import { StopTransaction } from './stop-transaction.js';
import { TransactionEvent } from './transaction-event.js';

@Table
export class Transaction extends Model implements TransactionDto {
  static readonly MODEL_NAME: string = Namespace.TransactionType;
  static readonly TRANSACTION_EVENTS_ALIAS = 'transactionEvents';
  static readonly TRANSACTION_EVENTS_FILTER_ALIAS = 'transactionEventsFilter';

  @Column(DataType.INTEGER)
  @ForeignKey(() => Location)
  declare locationId?: number;

  @BelongsTo(() => Location, 'locationId')
  location?: LocationDto;

  @ForeignKey(() => ChargingStation)
  @Column(DataType.INTEGER)
  declare stationId: number;

  @Column({
    type: DataType.STRING,
  })
  ocppConnectionName!: string;

  @BelongsTo(() => ChargingStation, 'stationId')
  station!: ChargingStationDto;

  @ForeignKey(() => Evse)
  @Column(DataType.INTEGER)
  declare evseId?: number;

  @BelongsTo(() => Evse, 'evseId')
  declare evse?: EvseDto | null;

  @ForeignKey(() => Connector)
  @Column(DataType.INTEGER)
  declare connectorId?: number;

  @BelongsTo(() => Connector, 'connectorId')
  declare connector?: ConnectorDto | null;

  @Column(DataType.INTEGER)
  @ForeignKey(() => Authorization)
  declare authorizationId?: number;

  @BelongsTo(() => Authorization, 'authorizationId')
  authorization?: AuthorizationDto;

  @Column(DataType.INTEGER)
  @ForeignKey(() => Tariff)
  declare tariffId?: number;

  @BelongsTo(() => Tariff, 'tariffId')
  tariff?: TariffDto;

  @Column(DataType.STRING)
  declare transactionId: string;

  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @HasMany(() => TransactionEvent, 'transactionDatabaseId')
  declare transactionEvents?: TransactionEventDto[];

  // required only for filtering, should not be used to pull transaction events
  declare transactionEventsFilter?: TransactionEventDto[];

  @HasMany(() => MeterValue, 'transactionDatabaseId')
  declare meterValues?: MeterValueDto[];

  @HasOne(() => StartTransaction, 'transactionDatabaseId')
  declare startTransaction?: StartTransactionDto;

  @HasOne(() => StopTransaction, 'transactionDatabaseId')
  declare stopTransaction?: StopTransactionDto;

  @HasMany(() => ChargingNeeds, 'transactionDatabaseId')
  declare chargingNeeds?: ChargingNeedsDto[];

  @Column(DataType.STRING)
  declare chargingState?: string | null;

  @Column(DataType.BIGINT)
  declare timeSpentCharging?: number | null;

  @Column(DataType.JSONB)
  declare transactionLimit?: TransactionLimit | null;

  /**
   * The starting meter value in kWh at the beginning of the transaction, if available. This is derived from StartTransaction in OCPP 1.6 or the first 'Transaction.Begin' or 'Sample.Periodic' meter value.
   */
  @Column(DataType.DECIMAL)
  declare meterStart?: number | null;

  @Column(DataType.DECIMAL)
  declare totalKwh?: number | null;

  @Column(DataType.STRING)
  declare stoppedReason?: string | null;

  @Column(DataType.INTEGER)
  declare remoteStartId?: number | null;

  @Column(DataType.DECIMAL)
  declare totalCost?: number;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('startTime')?.toISOString();
    },
  })
  declare startTime?: string;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('endTime')?.toISOString();
    },
  })
  declare endTime?: string;

  @Column(DataType.JSONB)
  declare customData?: any | null;

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

  static async resolveCreatedAt(transactionDatabaseId?: number | null): Promise<Date> {
    if (transactionDatabaseId != null) {
      const transaction = await Transaction.findOne({
        where: { id: transactionDatabaseId },
        attributes: ['createdAt'],
      });
      const createdAt = transaction?.get('createdAt') as Date | undefined;
      if (createdAt) {
        return createdAt;
      }
    }
    return new Date();
  }

  @BeforeCreate
  static async resolveStationId(instance: Transaction): Promise<void> {
    if (instance.stationId == null && instance.ocppConnectionName && instance.tenantId != null) {
      const station = await ChargingStation.findOne({
        where: { ocppConnectionName: instance.ocppConnectionName, tenantId: instance.tenantId },
        attributes: ['id'],
      });
      if (station) {
        instance.stationId = station.id;
      }
    }
  }

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: Transaction) {
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
