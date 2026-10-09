// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AsyncJobCreate, AsyncJobDto } from '@citrineos/types';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import type { AsyncJobStatusUpdate, IAsyncJobStatusRepository } from '../repositories.js';
import { AsyncJobStatus } from '../../models/async-job/async-job-status.js';

function toAsyncJobDto(model: AsyncJobStatus): AsyncJobDto {
  return {
    jobId: model.jobId,
    jobName: model.jobName,
    tenantPartnerId: model.tenantPartnerId,
    finishedAt: model.finishedAt ?? undefined,
    stoppedAt: model.stoppedAt,
    stopScheduled: model.stopScheduled,
    isFailed: model.isFailed,
    paginatedParams: model.paginationParams,
    totalObjects: model.totalObjects ?? undefined,
    tenantId: model.tenantId,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

export class SequelizeAsyncJobStatusRepository
  extends SequelizeRepository<AsyncJobStatus>
  implements IAsyncJobStatusRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: AsyncJobStatus.MODEL_NAME, logger, sequelizeInstance });
  }

  async createAsyncJobStatus(tenantId: number, input: AsyncJobCreate): Promise<AsyncJobDto> {
    const { paginatedParams, ...rest } = input;
    const asyncJobStatus = AsyncJobStatus.build({
      ...rest,
      paginationParams: paginatedParams,
      tenantId,
    });
    return toAsyncJobDto(await this._create(tenantId, asyncJobStatus));
  }

  async readByJobId(tenantId: number, jobId: string): Promise<AsyncJobDto | undefined> {
    const asyncJobStatus = await this.readByKey(tenantId, jobId);
    return asyncJobStatus ? toAsyncJobDto(asyncJobStatus) : undefined;
  }

  async updateAsyncJobStatus(
    tenantId: number,
    jobId: string,
    data: AsyncJobStatusUpdate,
  ): Promise<AsyncJobDto> {
    const { paginatedParams, ...rest } = data;
    const updated = await this._updateByKey(
      tenantId,
      paginatedParams === undefined ? rest : { ...rest, paginationParams: paginatedParams },
      jobId,
    );
    if (!updated) {
      throw new Error(`Failed to update AsyncJobStatus with id ${jobId}`);
    }
    return toAsyncJobDto(updated);
  }

  async deleteByJobId(tenantId: number, jobId: string): Promise<AsyncJobDto | undefined> {
    const deleted = await this._deleteByKey(tenantId, jobId);
    return deleted ? toAsyncJobDto(deleted) : undefined;
  }
}

export default SequelizeAsyncJobStatusRepository;
