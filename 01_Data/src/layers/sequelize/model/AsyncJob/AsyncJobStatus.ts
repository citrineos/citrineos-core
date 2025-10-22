// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { TenantDto } from '@citrineos/base';
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
import { Tenant } from '../Tenant.js';
import { TenantPartner } from '../TenantPartner.js';

export enum AsyncJobName {
  FETCH_OCPI_TOKENS = 'FETCH_OCPI_TOKENS',
}

export enum AsyncJobAction {
  RESUME = 'RESUME',
  STOP = 'STOP',
}

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

  @Column(DataType.STRING)
  declare jobName: AsyncJobName;

  @ForeignKey(() => TenantPartner)
  @Column(DataType.INTEGER)
  declare tenantPartnerId: number;

  @BelongsTo(() => TenantPartner)
  declare tenantPartner: TenantPartner;

  @Column(DataType.DATE)
  declare finishedAt?: Date;

  @Column(DataType.DATE)
  declare stoppedAt?: Date | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare stopScheduled: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isFailed: boolean;

  @Column(DataType.JSON)
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

  @BelongsTo(() => Tenant)
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
  jobName!: AsyncJobName;
  tenantPartnerId!: number;
  tenantPartner?: TenantPartner;
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
