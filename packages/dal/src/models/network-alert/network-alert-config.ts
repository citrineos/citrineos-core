// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { NetworkAlertConfigDto, NetworkAlertType, TenantDto } from '@citrineos/types';
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
import { Tenant } from '../tenant.js';

@Table({
  indexes: [
    {
      unique: true,
      name: 'network_alert_configs_tenant_id_type',
      fields: ['tenantId', 'type'],
    },
  ],
})
export class NetworkAlertConfig
  extends Model
  implements Omit<NetworkAlertConfigDto, 'type' | 'rules'>
{
  static readonly MODEL_NAME: string = 'NetworkAlertConfig';

  @Column({ type: DataType.STRING, allowNull: false })
  declare type: NetworkAlertType;

  @Column(DataType.BOOLEAN)
  declare enabled?: boolean | null;

  @Column(DataType.JSONB)
  declare rules?: NetworkAlertConfigDto['rules'];

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
  static setDefaultTenant(instance: NetworkAlertConfig) {
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
