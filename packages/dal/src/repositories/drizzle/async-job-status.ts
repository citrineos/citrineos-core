// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AsyncJobCreate, AsyncJobDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  type AsyncJobStatusEntity,
  asyncJobStatusTable,
  tenantAsyncJobStatusTable,
} from '../../db/drizzle/schema/async-job-status.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';
import type { AsyncJobStatusUpdate, IAsyncJobStatusRepository } from '../repositories.js';

type AsyncJobStatusInsert = typeof asyncJobStatusTable.$inferInsert;

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

export class DrizzleAsyncJobStatusRepository
  extends DrizzleRepository<typeof asyncJobStatusTable, AsyncJobDto>
  implements IAsyncJobStatusRepository
{
  protected getTable(tenantId: number): typeof asyncJobStatusTable {
    return this.useTenantSchema ? tenantAsyncJobStatusTable(tenantId) : asyncJobStatusTable;
  }

  protected toDto(row: AsyncJobStatusEntity): AsyncJobDto {
    return toAsyncJobStatusDto(row);
  }

  async createAsyncJobStatus(tenantId: number, input: AsyncJobCreate): Promise<AsyncJobDto> {
    const values: Omit<AsyncJobStatusInsert, 'tenantId'> = {
      jobName: input.jobName,
      tenantPartnerId: input.tenantPartnerId,
      finishedAt: input.finishedAt,
      stoppedAt: input.stoppedAt,
      stopScheduled: input.stopScheduled,
      isFailed: input.isFailed,
      paginationParams: input.paginatedParams,
      totalObjects: input.totalObjects,
    };
    return await this.insert(tenantId, values);
  }

  async readByJobId(tenantId: number, jobId: string): Promise<AsyncJobDto | undefined> {
    const table = this.getTable(tenantId);
    const rows = await this.db
      .select()
      .from(table)
      .where(and(eq(table.id, jobId), this.tenantFilter(table, tenantId)))
      .limit(1);

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async updateAsyncJobStatus(
    tenantId: number,
    jobId: string,
    data: AsyncJobStatusUpdate,
  ): Promise<AsyncJobDto> {
    const { paginatedParams, ...rest } = data;
    const values: Partial<AsyncJobStatusInsert> = { ...rest, updatedAt: new Date() };
    if (paginatedParams !== undefined) {
      values.paginationParams = paginatedParams;
    }

    const table = this.getTable(tenantId);
    const rows = await this.db
      .update(table)
      .set(values)
      .where(and(eq(table.id, jobId), this.tenantFilter(table, tenantId)))
      .returning();

    if (!rows[0]) {
      throw new Error(`Failed to update AsyncJobStatus with id ${jobId}`);
    }
    const dto = this.toDto(rows[0]);
    this.emit('updated', [dto]);
    return dto;
  }

  async deleteByJobId(tenantId: number, jobId: string): Promise<AsyncJobDto | undefined> {
    const table = this.getTable(tenantId);
    const rows = await this.db
      .delete(table)
      .where(and(eq(table.id, jobId), this.tenantFilter(table, tenantId)))
      .returning();

    if (!rows[0]) return undefined;
    const dto = this.toDto(rows[0]);
    this.emit('deleted', [dto]);
    return dto;
  }
}
