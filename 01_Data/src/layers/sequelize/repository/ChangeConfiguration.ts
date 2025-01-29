// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SystemConfig, OCPP1_6 } from '@citrineos/base';
import { IChangeConfigurationRepository } from '../../../interfaces';
import { ChangeConfiguration, SequelizeRepository } from '..';
import { Logger, ILogObj } from 'tslog';
import { Sequelize } from 'sequelize-typescript';

export class SequelizeChangeConfigurationRepository extends SequelizeRepository<ChangeConfiguration> implements IChangeConfigurationRepository {
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, ChangeConfiguration.MODEL_NAME, logger, sequelizeInstance);
  }

  async updateStatusByStationIdAndKey(stationId: string, key: string, status: OCPP1_6.ChangeConfigurationResponseStatus): Promise<ChangeConfiguration | undefined> {
    const configurations = await this.updateAllByQuery(
      { status },
      {
        where: {
          // unique constraint
          stationId,
          key,
        },
      },
    );
    if (configurations && configurations.length > 0) {
      return configurations[0];
    } else {
      return undefined;
    }
  }

  async createOrUpdateChangeConfiguration(configuration: ChangeConfiguration): Promise<ChangeConfiguration | undefined> {
    let changeConfiguration: ChangeConfiguration | undefined;
    await this.s.transaction(async (sequelizeTransaction) => {
      const [savedConfig, created] = await this.readOrCreateByQuery({
        where: {
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
        changeConfiguration = await savedConfig.update({ ...configuration }, { transaction: sequelizeTransaction });
        this.emit('updated', [changeConfiguration]);
      }
    });

    return changeConfiguration;
  }
}
