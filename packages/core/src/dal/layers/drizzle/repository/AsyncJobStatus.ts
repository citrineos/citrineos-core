// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AsyncJobDto } from '@citrineos/types';
import {
  type AsyncJobStatusEntity,
  asyncJobStatusTable,
  tenantAsyncJobStatusTable,
} from '../schema/AsyncJobStatus.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external AsyncJobDto contract.
export function toAsyncJobStatusDto(entity: AsyncJobStatusEntity): AsyncJobDto {
  const dto: Explicit<AsyncJobDto> = {
    // `id` is the DB "jobId" column (see schema).
    jobId: entity.id,
    jobName: entity.jobName as AsyncJobDto['jobName'],
    tenantPartnerId: entity.tenantPartnerId as number,
    tenantPartner: undefined,
    finishedAt: entity.finishedAt ?? undefined,
    stoppedAt: entity.stoppedAt,
    stopScheduled: entity.stopScheduled ?? false,
    isFailed: entity.isFailed ?? false,
    paginatedParams: entity.paginationParams ?? {},
    totalObjects: entity.totalObjects ?? undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleAsyncJobStatusRepository extends DrizzleRepository<
  typeof asyncJobStatusTable,
  AsyncJobDto
> {
  protected getTable(tenantId: number): typeof asyncJobStatusTable {
    return this.useTenantSchema ? tenantAsyncJobStatusTable(tenantId) : asyncJobStatusTable;
  }

  protected toDto(row: AsyncJobStatusEntity): AsyncJobDto {
    return toAsyncJobStatusDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
