// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IDataTransferRepository } from '../../../interfaces/index.js';
import { DataTransferData } from '../model/index.js';
import { SequelizeRepository } from './Base.js';

export class SequelizeDataTransferRepository
  extends SequelizeRepository<DataTransferData>
  implements IDataTransferRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, DataTransferData.MODEL_NAME, logger, sequelizeInstance);
  }

  public async createDataTransfer(
    tenantId: number,
    data: Partial<DataTransferData>,
  ): Promise<DataTransferData> {
    return this.create(tenantId, DataTransferData.build({ ...data, tenantId }));
  }
}
