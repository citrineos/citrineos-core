// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IBaseDto } from './base.dto';

// AsyncJob enums
export enum AsyncJobName {
  FETCH_OCPI_TOKENS = 'FETCH_OCPI_TOKENS',
}

export enum AsyncJobAction {
  RESUME = 'RESUME',
  STOP = 'STOP',
}

export interface AsyncJobPaginatedParams {
  offset?: number;
  limit?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IAsyncJobDto extends IBaseDto {
  jobId: string;
  jobName: AsyncJobName;
  tenantPartnerId: number;
  tenantPartner?: {
    id: number;
    name?: string;
    countryCode?: string; // MSP countryCode
    partyId?: string; // MSP partyId
    tenant?: {
      id: number;
      countryCode?: string; // CPO countryCode
      partyId?: string; // CPO partyId
    };
  };
  finishedAt?: Date;
  stoppedAt?: Date | null;
  stopScheduled: boolean;
  isFailed?: boolean;
  paginatedParams: AsyncJobPaginatedParams;
  totalObjects?: number;
}

export interface AsyncJobRequest {
  tenantPartnerId: number;
  paginatedParams: AsyncJobPaginatedParams;
}
