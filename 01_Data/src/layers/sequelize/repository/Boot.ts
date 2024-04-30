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

  constructor(config: SystemConfig, namespace: string, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize, variableAttributes?: CrudRepository<VariableAttribute>) {
    super(config, namespace, logger, sequelizeInstance);
    this.variableAttributes = variableAttributes ? variableAttributes : new SequelizeVariableAttributeRepository(config, namespace, logger, sequelizeInstance);
  }

  async createOrUpdateByKey(value: BootConfig, key: string): Promise<Boot | undefined> {
    const result = await this._upsert({ id: key, ...value } as Boot); // Calling the protected method avoids emitting the event before the variables have been assigned below
    const savedBootConfig = result[0];
    if (savedBootConfig) {
      if (value.pendingBootSetVariableIds) {
        savedBootConfig.pendingBootSetVariables = await this.manageSetVariables(value.pendingBootSetVariableIds, key, savedBootConfig.id);
      }
    }
    if (result[1]) {
      this.emit('created', [result[0]]);
    } else {
      this.emit('updated', [result[0]]);
    }
    return savedBootConfig;
  }

  async updateStatusByKey(status: RegistrationStatusEnumType, statusInfo: StatusInfoType | undefined, key: string): Promise<Boot | undefined> {
    return await this.updateByKey({ status, statusInfo }, key);
  }

  async updateLastBootTimeByKey(lastBootTime: string, key: string): Promise<Boot | undefined> {
    return await this.updateByKey({ lastBootTime }, key);
  }

  async readByKey(key: string): Promise<Boot | undefined> {
    return await this.readByKey(key);
  }

  async existsByKey(key: string): Promise<boolean> {
    return await this.existsByKey(key);
  }

  async deleteByKey(key: string): Promise<Boot | undefined> {
    return await this.deleteByKey(key);
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
