// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChangeConfigurationCreate, ChangeConfigurationDto } from '@citrineos/types';
import type { IChangeConfigurationRepository } from '../repositories.js';
import { ChangeConfiguration } from '../../models/change-configuration.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';

export class SequelizeChangeConfigurationRepository
  extends SequelizeRepository<ChangeConfiguration>
  implements IChangeConfigurationRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: ChangeConfiguration.MODEL_NAME, logger, sequelizeInstance });
  }

  async findByStationAndKey(
    tenantId: number,
    ocppConnectionName: string,
    key: string,
  ): Promise<ChangeConfigurationDto | undefined> {
    return await this.readOnlyOneByQuery(tenantId, {
      where: { tenantId, ocppConnectionName, key },
    });
  }

  async listByStation(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<ChangeConfigurationDto[]> {
    return await this.readAllByQuery(tenantId, {
      where: { ocppConnectionName },
    });
  }

  async createOrUpdateChangeConfiguration(
    tenantId: number,
    input: ChangeConfigurationCreate,
  ): Promise<ChangeConfigurationDto | undefined> {
    let changeConfiguration: ChangeConfiguration | undefined;
    await this.s.transaction(async (sequelizeTransaction) => {
      const [savedConfig, created] = await this.readOrCreateByQuery(tenantId, {
        where: {
          tenantId: tenantId,
          ocppConnectionName: input.ocppConnectionName,
          key: input.key,
        },
        defaults: {
          ...input,
          tenantId,
        },
        transaction: sequelizeTransaction,
      });
      if (created) {
        changeConfiguration = savedConfig;
      } else {
        changeConfiguration = await savedConfig.update(
          { ...input, tenantId },
          { transaction: sequelizeTransaction },
        );
        this.emit('updated', [changeConfiguration]);
      }
    });

    return changeConfiguration;
  }
}

export default SequelizeChangeConfigurationRepository;
