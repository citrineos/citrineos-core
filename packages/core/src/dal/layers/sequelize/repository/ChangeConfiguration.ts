// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IChangeConfigurationRepository } from '../../../interfaces/repositories.js';
import { ChangeConfiguration } from '../model/ChangeConfiguration.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';

export class SequelizeChangeConfigurationRepository
  extends SequelizeRepository<ChangeConfiguration>
  implements IChangeConfigurationRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: ChangeConfiguration.MODEL_NAME, logger, sequelizeInstance });
  }

  async createOrUpdateChangeConfiguration(
    tenantId: number,
    configuration: ChangeConfiguration,
  ): Promise<ChangeConfiguration | undefined> {
    let changeConfiguration: ChangeConfiguration | undefined;
    await this.s.transaction(async (sequelizeTransaction) => {
      const [savedConfig, created] = await this.readOrCreateByQuery(tenantId, {
        where: {
          tenantId: tenantId,
          ocppConnectionName: configuration.ocppConnectionName,
          key: configuration.key,
        },
        defaults: {
          ...configuration,
        },
        transaction: sequelizeTransaction,
      });
      if (created) {
        changeConfiguration = savedConfig;
      } else {
        changeConfiguration = await savedConfig.update(
          { ...configuration },
          { transaction: sequelizeTransaction },
        );
        this.emit('updated', [changeConfiguration]);
      }
    });

    return changeConfiguration;
  }
}

export default SequelizeChangeConfigurationRepository;
