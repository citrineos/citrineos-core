// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  Column,
  DataType,
  Default,
  PrimaryKey,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { BaseModelWithTenant } from '../BaseModelWithTenant';
import { TenantPartner } from '../TenantPartner';

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
export class AsyncJobStatus extends BaseModelWithTenant {
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
