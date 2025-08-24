// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  DEFAULT_TENANT_ID,
  ISubscriptionDto,
  ITenantDto,
  OCPP2_0_1_Namespace,
} from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Index,
  Model,
  Table,
} from 'sequelize-typescript';
import { Tenant } from '../Tenant.js';

@Table
export class Subscription extends Model implements ISubscriptionDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.Subscription;

  @Index
  @Column
  declare stationId: string;

  @Column({
    defaultValue: false,
  })
  declare onConnect: boolean;

  @Column({
    defaultValue: false,
  })
  declare onClose: boolean;

  @Column({
    defaultValue: false,
  })
  declare onMessage: boolean;

  @Column({
    defaultValue: false,
  })
  declare sentMessage: boolean;

  @Column(DataType.STRING)
  declare messageRegexFilter?: string | null;

  @Column
  declare url: string;

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
  static setDefaultTenant(instance: Subscription) {
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
