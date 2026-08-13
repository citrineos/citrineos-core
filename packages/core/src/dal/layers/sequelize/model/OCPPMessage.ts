// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import {
  type ChargingStationDto,
  type MessageState,
  type MessageTypeId,
  type OCPPMessageDto,
  type TenantDto,
  MessageOrigin,
  OCPPVersion,
} from '@citrineos/types';
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

/**
 * Range partitioned on "createdAt", one partition per ISO week, with a rolling
 * retention window
 */
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

  // OCPP RPC messageTypeId (2 = Call, 3 = CallResult, 4 = CallError). Absent for messages
  // that could not be parsed far enough to determine it.
  @Column(DataType.INTEGER)
  declare type?: MessageTypeId;

  /**
   * @deprecated Superseded by `type`, kept in sync on every write so consumers written against
   * the pre-`type` schema keep working. STRING (not INTEGER) because that is the column type it
   * has always had — MessageState is persisted as its numeric enum value in text form.
   */
  @Column(DataType.STRING)
  declare state?: MessageState;

  @Column(DataType.STRING)
  declare protocol: OCPPVersion;

  @Column(DataType.STRING)
  declare action?: string;

  // Parsed OCPP payload only — the surrounding RPC frame lives in `raw`.
  @Column(DataType.JSONB)
  declare payload?: any;

  // Exact message as it appeared on the wire. TEXT because messages routinely exceed 255 chars.
  @Column({ type: DataType.TEXT, allowNull: false })
  declare raw: string;

  /**
   * @deprecated Superseded by `payload` + `raw`, kept in sync on every write so consumers
   * written against the pre-`payload` schema keep working. Holds the whole RPC frame; null for
   * messages that never parsed into one.
   */
  @Column(DataType.JSONB)
  declare message?: any;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation?: ChargingStationDto;

  // "OCPPMessages" is range partitioned on "createdAt", so its only unique key is (id, "createdAt") and a
  // single-column FK cannot target it. ocpp_correlate_response() and
  // ocpp_correlate_call() are the sole maintainers of this link;
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
