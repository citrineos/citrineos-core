// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { BootstrapConfig } from '@citrineos/base';
import { IChangeConfigurationRepository } from '../../../interfaces';
import { ChangeConfiguration, SequelizeRepository } from '..';
import { Logger, ILogObj } from 'tslog';
import { Sequelize } from 'sequelize-typescript';

export class SequelizeChangeConfigurationRepository
  extends SequelizeRepository<ChangeConfiguration>
  implements IChangeConfigurationRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, ChangeConfiguration.MODEL_NAME, logger, sequelizeInstance);
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
          stationId: configuration.stationId,
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
