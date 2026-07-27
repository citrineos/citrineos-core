// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type ChargingStationDto,
  type MessageState,
  type OCPPMessageDto,
  type TenantDto,
  MessageOrigin,
  OCPPVersion,
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
  Index,
  Model,
  Table,
} from 'sequelize-typescript';
import { ChargingStation } from './Location/index.js';
import { Tenant } from './Tenant.js';

@Table
export class OCPPMessage extends Model implements OCPPMessageDto {
  static readonly MODEL_NAME: string = Namespace.OCPPMessage;

  @ForeignKey(() => ChargingStation)
  @Column(DataType.INTEGER)
  declare stationId?: number;

  @Index
  @Column(DataType.STRING)
  declare ocppConnectionName: string;

  @Index
  @Column(DataType.STRING)
  declare correlationId?: string;

  @Column(DataType.STRING)
  declare origin: MessageOrigin;

  @Column(DataType.STRING)
  declare state: MessageState;

  @Column(DataType.STRING)
  declare protocol: OCPPVersion;

  @Column(DataType.STRING)
  declare action: string;

  @Column(DataType.JSONB)
  declare message: any;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation?: ChargingStationDto;

  @ForeignKey(() => OCPPMessage)
  @Index
  @Column(DataType.INTEGER)
  declare requestMessageId?: number;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp')?.toISOString();
    },
  })
  declare timestamp: string;

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

  @BelongsTo(() => OCPPMessage, { foreignKey: 'requestMessageId', as: 'requestMessage' })
  declare requestMessage?: OCPPMessage;

  @HasMany(() => OCPPMessage, { foreignKey: 'requestMessageId', as: 'responseMessages' })
  declare responseMessages?: OCPPMessage[];

  @BeforeCreate
  static async resolveStationId(instance: OCPPMessage): Promise<void> {
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
  static setDefaultTenant(instance: OCPPMessage) {
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
