// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, SystemConfig, type BootConfig, type RegistrationStatusEnumType, type StatusInfoType } from '@citrineos/base';
import { type IBootRepository } from '../../../interfaces/repositories';
import { Boot } from '../model/Boot';
import { VariableAttribute } from '../model/DeviceModel';
import { SequelizeRepository } from '..';
import { Logger, ILogObj } from 'tslog';
import { Sequelize } from 'sequelize-typescript';

export class SequelizeBootRepository extends SequelizeRepository<Boot> implements IBootRepository {
  variableAttributes: CrudRepository<VariableAttribute>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize, variableAttributes?: CrudRepository<VariableAttribute>) {
    super(config, Boot.MODEL_NAME, logger, sequelizeInstance);
    this.variableAttributes = variableAttributes ? variableAttributes : new SequelizeRepository<VariableAttribute>(config, VariableAttribute.MODEL_NAME, logger, sequelizeInstance);
  }

  async createOrUpdateByKey(value: BootConfig, key: string): Promise<Boot | undefined> {
    let savedBootConfig: Boot | undefined;
    let created;
    await this.s.transaction(async (transaction) => {
      savedBootConfig = await this.s.models[this.namespace].findByPk(key, { transaction }).then((row) => row as Boot);
      created = !savedBootConfig;
      if (!savedBootConfig) {
        savedBootConfig = await Boot.build({ id: key, ...value }).save({ transaction });
      } else {
        savedBootConfig = (await this.updateAllByQuery(Boot.build({ ...value }), { where: { id: key }, transaction }))[0];
      }
    });

    if (savedBootConfig) {
      if (value.pendingBootSetVariableIds) {
        savedBootConfig.pendingBootSetVariables = await this.manageSetVariables(value.pendingBootSetVariableIds, key, savedBootConfig.id);
      }

      if (created) {
        this.emit('created', [savedBootConfig]);
      } else {
        this.emit('updated', [savedBootConfig]);
      }
    }
    return savedBootConfig;
  }

  async updateStatusByKey(status: RegistrationStatusEnumType, statusInfo: StatusInfoType | undefined, key: string): Promise<Boot | undefined> {
    return await this.updateByKey({ status, statusInfo }, key);
  }

  async updateLastBootTimeByKey(lastBootTime: string, key: string): Promise<Boot | undefined> {
    return await this.updateByKey({ lastBootTime }, key);
  }

  /**
   * Private Methods
   */

  private async manageSetVariables(setVariableIds: number[], stationId: string, bootConfigId: string): Promise<VariableAttribute[]> {
    const managedSetVariables: VariableAttribute[] = [];
    // Unassigns variables
    await this.variableAttributes.updateAllByQuery(
      { bootConfigId: undefined },
      {
        where: {
          stationId,
        },
      },
    );
    // Assigns variables, or throws an error if variable with id does not exist
    for (const setVariableId of setVariableIds) {
      const setVariable: VariableAttribute | undefined = await this.variableAttributes.updateByKey({ bootConfigId }, setVariableId.toString());
      if (!setVariable) {
        // When this is called from createOrUpdateByKey, this code should be impossible to reach
        // Since the boot object would have already been upserted with the pendingBootSetVariableIds as foreign keys
        // And if they were not valid foreign keys, it would have thrown an error
        throw new Error('SetVariableId does not exist ' + setVariableId);
      } else {
        managedSetVariables.push(setVariable);
      }
    }
    return managedSetVariables;
  }
}
