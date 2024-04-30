// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ICrudRepository, type BootConfig, type RegistrationStatusEnumType, type StatusInfoType } from '@citrineos/base';
import { type IBootRepository } from '../../../interfaces/repositories';
import { Boot } from '../model/Boot';
import { VariableAttribute } from '../model/DeviceModel';

export class BootRepository implements IBootRepository {
  boots: ICrudRepository<Boot>;
  variableAttributes: ICrudRepository<VariableAttribute>;

  constructor(boots: ICrudRepository<Boot>, variableAttributes: ICrudRepository<VariableAttribute>) {
    this.boots = boots;
    this.variableAttributes = variableAttributes;
  }

  async createOrUpdateByKey(value: BootConfig, key: string): Promise<Boot | undefined> {
    return await this.boots.upsert({ id: key, ...value } as Boot).then(async (savedBootConfig) => {
      if (savedBootConfig) {
        if (value.pendingBootSetVariableIds) {
          savedBootConfig.pendingBootSetVariables = await this.manageSetVariables(value.pendingBootSetVariableIds, key, savedBootConfig.id);
        }
      }
      return savedBootConfig;
    });
  }

  async updateStatusByKey(status: RegistrationStatusEnumType, statusInfo: StatusInfoType | undefined, key: string): Promise<Boot | undefined> {
    return await this.boots.updateByKey({ status, statusInfo }, key);
  }

  async updateLastBootTimeByKey(lastBootTime: string, key: string): Promise<Boot | undefined> {
    return await this.boots.updateByKey({ lastBootTime }, key);
  }

  async readByKey(key: string): Promise<Boot | undefined> {
    return await this.boots.readByKey(key);
  }

  async existsByKey(key: string): Promise<boolean> {
    return await this.boots.existsByKey(key);
  }

  async deleteByKey(key: string): Promise<boolean> {
    return await this.boots.deleteByKey(key);
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
        throw new Error('SetVariableId does not exist ' + setVariableId);
      } else {
        managedSetVariables.push(setVariable);
      }
    }
    return managedSetVariables;
  }
}
