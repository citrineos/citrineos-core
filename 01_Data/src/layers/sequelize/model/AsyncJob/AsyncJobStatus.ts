// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Column, DataType, Default, PrimaryKey, Table } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

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

  @Column(DataType.ENUM(...Object.values(AsyncJobName)))
  declare jobName: AsyncJobName;

  @Column(DataType.STRING)
  declare mspCountryCode: string;

  @Column(DataType.STRING)
  declare mspPartyId: string;

  @Column(DataType.STRING)
  declare cpoCountryCode: string;

  @Column(DataType.STRING)
  declare cpoPartyId: string;

  @Column(DataType.DATE)
  declare finishedAt?: Date;

  @Column(DataType.DATE)
  declare stoppedAt?: Date | null;

  @Column(DataType.BOOLEAN)
  declare stopScheduled: boolean;

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
      mspCountryCode: this.mspCountryCode,
      mspPartyId: this.mspPartyId,
      cpoCountryCode: this.cpoCountryCode,
      cpoPartyId: this.cpoPartyId,
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
  mspCountryCode!: string;
  mspPartyId!: string;
  cpoCountryCode!: string;
  cpoPartyId!: string;
  createdAt!: Date;
  finishedAt?: Date;
  stoppedAt?: Date | null;
  stopScheduled!: boolean;
  isFailed?: boolean;
  paginatedParams!: PaginatedParams;
  totalObjects?: number;
}

export class AsyncJobRequest {
  mspCountryCode!: string;
  mspPartyId!: string;
  cpoCountryCode!: string;
  cpoPartyId!: string;
  paginatedParams!: PaginatedParams;
}
