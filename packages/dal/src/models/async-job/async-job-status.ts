// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AsyncJobNameEnumType, TenantDto, TenantPartnerDto } from '@citrineos/types';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

import { Tenant } from '../tenant.js';
import { TenantPartner } from '../tenant-partner.js';

export interface PaginatedParams {
  offset?: number;
  limit?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

@Table
export class AsyncJobStatus extends Model {
  static readonly MODEL_NAME: string = 'AsyncJobStatus';

  @PrimaryKey
  @Default(() => uuidv4()) // Automatically generate jobId
  @Column(DataType.STRING)
  declare jobId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare jobName: AsyncJobNameEnumType;

  @ForeignKey(() => TenantPartner)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare tenantPartnerId: number;

  @BelongsTo(() => TenantPartner, { foreignKey: 'tenantPartnerId', as: 'asyncJobTenantPartner' })
  declare tenantPartner: TenantPartnerDto;

  @Column(DataType.DATE)
  declare finishedAt?: Date;

  @Column(DataType.DATE)
  declare stoppedAt?: Date | null;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare stopScheduled: boolean;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isFailed: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  declare paginationParams: PaginatedParams;

  @Column(DataType.INTEGER) // Total number of objects in the client's system
  declare totalObjects?: number;

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
  static setDefaultTenant(instance: AsyncJobStatus) {
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

  toDTO(): AsyncJobStatusDTO {
    return {
      jobId: this.jobId,
      jobName: this.jobName,
      tenantPartnerId: this.tenantPartnerId,
      tenantPartner: this.tenantPartner,
      createdAt: this.createdAt,
      finishedAt: this.finishedAt,
      stoppedAt: this.stoppedAt,
      stopScheduled: this.stopScheduled,
      isFailed: this.isFailed,
      paginatedParams: this.paginationParams,
      totalObjects: this.totalObjects,
    };
  }
}

export class AsyncJobStatusDTO {
  jobId!: string;
  jobName!: AsyncJobNameEnumType;
  tenantPartnerId!: number;
  tenantPartner?: TenantPartnerDto;
  createdAt!: Date;
  finishedAt?: Date;
  stoppedAt?: Date | null;
  stopScheduled!: boolean;
  isFailed?: boolean;
  paginatedParams!: PaginatedParams;
  totalObjects?: number;
}

export class AsyncJobRequest {
  tenantPartnerId!: number;
  paginatedParams!: PaginatedParams;
}
