// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { BootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { FindOptions } from 'sequelize';
import { ILogObj, Logger } from 'tslog';
import { AsyncJobStatus } from '../model/AsyncJob/AsyncJobStatus';

export class SequelizeAsyncJobStatusRepository extends SequelizeRepository<AsyncJobStatus> {
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, AsyncJobStatus.MODEL_NAME, logger, sequelizeInstance);
  }

  async createAsyncJobStatus(asyncJobStatus: AsyncJobStatus): Promise<AsyncJobStatus> {
    return await this._create(asyncJobStatus.tenantId, asyncJobStatus);
  }

  async updateAsyncJobStatus(updateData: {
    jobId: string;
    paginationParams?: any;
    totalObjects?: number;
    finishedAt?: Date;
    stoppedAt?: Date | null;
    stopScheduled?: boolean;
    isFailed?: boolean;
  }): Promise<AsyncJobStatus> {
    const { jobId, ...data } = updateData;

    // Use the base class method for updating
    const updated = await this._updateByKey(0, data as Partial<AsyncJobStatus>, jobId);
    if (!updated) {
      throw new Error(`Failed to update AsyncJobStatus with id ${jobId}`);
    }
    return updated;
  }

  // Method for finding by jobId as string (expected by OCPI service)
  async readByJobId(jobId: string): Promise<AsyncJobStatus | undefined> {
    return (
      ((await this.s.models[this.namespace].findOne({
        where: { jobId },
      } as FindOptions)) as AsyncJobStatus | null) ?? undefined
    );
  }

  // Method for querying with custom options (expected by OCPI service)
  async findAllByQuery(query: { where: any }): Promise<AsyncJobStatus[]> {
    return await super.readAllByQuery(0, query);
  }

  // Method for deleting by jobId as string (expected by OCPI service)
  async deleteByJobId(jobId: string): Promise<AsyncJobStatus | undefined> {
    return await this._deleteByKey(0, jobId);
  }
}
