// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  StartTransactionDto,
  StopTransactionDto,
  TenantDto,
  TransactionDto,
  TransactionEventDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
} from 'sequelize-typescript';
import { Authorization } from '../Authorization/Authorization.js';
import { Tariff } from '../Tariff/Tariffs.js';
import { type ChargingStation as ChargingStationType } from '../Location/ChargingStation.js';
// keep the direct import to avoid circular dependency
import { Connector } from '../Location/Connector.js';
import { Evse } from '../Location/Evse.js';
import { type Location as LocationType } from '../Location/Location.js';
import { ChargingStation } from '../Location/index.js';

import { MeterValue } from './MeterValue.js';

@Table
export class Transaction extends Model implements TransactionDto {
  static readonly MODEL_NAME: string = Namespace.TransactionType;
  static readonly TRANSACTION_EVENTS_ALIAS = 'transactionEvents';
  static readonly TRANSACTION_EVENTS_FILTER_ALIAS = 'transactionEventsFilter';

  @Column(DataType.INTEGER)
  locationId?: number;

  location?: LocationType;

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.INTEGER,
    unique: 'stationPkId_transactionId',
    allowNull: true,
  })
  declare stationPkId?: number;

  @Column({
    type: DataType.STRING,
  })
  stationId!: string;

  station!: ChargingStationType;

  @Column(DataType.INTEGER)
  declare evseId?: number;

  declare evse?: Evse | null;

  @Column(DataType.INTEGER)
  declare connectorId?: number;

  declare connector?: Connector | null;

  @Column(DataType.INTEGER)
  authorizationId?: number;

  authorization?: Authorization;

  @Column(DataType.INTEGER)
  tariffId?: number;

  tariff?: Tariff;

  @Column({
    type: DataType.STRING,
    unique: 'stationPkId_transactionId',
  })
  declare transactionId: string;

  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  declare transactionEvents?: TransactionEventDto[];

  // required only for filtering, should not be used to pull transaction events
  declare transactionEventsFilter?: TransactionEventDto[];

  declare meterValues?: MeterValue[];

  declare startTransaction?: StartTransactionDto;

  declare stopTransaction?: StopTransactionDto;

  @Column(DataType.STRING)
  declare chargingState?: string | null;

  @Column(DataType.BIGINT)
  declare timeSpentCharging?: number | null;

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

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  declare tenant?: TenantDto;

  @BeforeCreate
  static async resolveStationPkId(instance: Transaction): Promise<void> {
    if (instance.stationPkId == null && instance.stationId && instance.tenantId != null) {
      const station = await ChargingStation.findOne({
        where: { id: instance.stationId, tenantId: instance.tenantId },
        attributes: ['pkId'],
      });
      if (station) {
        instance.stationPkId = station.pkId;
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
