// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TenantPartnerDto } from '@citrineos/base';

// Temporarily define the types locally until the import issue is resolved
// TODO: Import these from @citrineos/base once the build/link issue is fixed

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

export interface AsyncJobRequest {
  tenantPartnerId: number;
  paginatedParams: AsyncJobPaginatedParams;
}

// API Response types specific to citrineos-ocpi
export interface AsyncJobStatusResponse {
  jobId: string;
  jobName: AsyncJobName;
  tenantPartnerId: number;
  tenantPartner?: TenantPartnerDto;
  finishedAt?: Date;
  stoppedAt?: Date | null;
  stopScheduled: boolean;
  isFailed?: boolean;
  paginatedParams: AsyncJobPaginatedParams;
  totalObjects?: number;
  createdAt: Date;
  updatedAt: Date;
}
