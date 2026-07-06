// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { BootConfig, OCPP2_common_types, RegistrationStatusEnumType } from '@citrineos/base';
import { CrudRepository } from '@citrineos/base';
import type { IBootRepository } from '../../../interfaces/repositories.js';
import { Boot } from '../model/Boot.js';
import { VariableAttribute } from '../model/DeviceModel/VariableAttribute.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';

export class SequelizeBootRepository extends SequelizeRepository<Boot> implements IBootRepository {
  variableAttributes: CrudRepository<VariableAttribute>;

  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: Boot.MODEL_NAME, logger, sequelizeInstance });
    this.variableAttributes = new SequelizeRepository<VariableAttribute>({
      config,
      namespace: VariableAttribute.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
  }

  async createOrUpdateByKey(
    tenantId: number,
    value: BootConfig,
    key: string,
  ): Promise<Boot | undefined> {
    let savedBootConfig: Boot | undefined;
    let created;
    await this.s.transaction(async (sequelizeTransaction) => {
      const [boot, bootCreated] = await this.readOrCreateByQuery(tenantId, {
        where: {
          tenantId,
          id: key,
        },
        defaults: {
          ...value,
        },
        transaction: sequelizeTransaction,
      });

      if (!bootCreated) {
        savedBootConfig = await boot.update({ ...value }, { transaction: sequelizeTransaction });
      } else {
        savedBootConfig = boot;
      }

      created = bootCreated;
    });

    if (savedBootConfig) {
      if (value.pendingBootSetVariableIds) {
        savedBootConfig.pendingBootSetVariables = await this.manageSetVariables(
          tenantId,
          value.pendingBootSetVariableIds,
          key,
          savedBootConfig.id,
        );
      }

      this.emit(created ? 'created' : 'updated', [savedBootConfig]);
    }

    return savedBootConfig;
  }

  async updateStatusByKey(
    tenantId: number,
    status: RegistrationStatusEnumType,
    statusInfo: OCPP2_common_types.StatusInfoType | undefined,
    key: string,
  ): Promise<Boot | undefined> {
    return await this.updateByKey(tenantId, { status, statusInfo }, key);
  }

  async updateLastBootTimeByKey(
    tenantId: number,
    lastBootTime: string,
    key: string,
  ): Promise<Boot | undefined> {
    return await this.updateByKey(tenantId, { lastBootTime }, key);
  }

  /**
   * Private Methods
   */

  private async manageSetVariables(
    tenantId: number,
    setVariableIds: number[],
    ocppConnectionName: string,
    bootConfigId: string,
  ): Promise<VariableAttribute[]> {
    const managedSetVariables: VariableAttribute[] = [];
    // Unassigns variables
    await this.variableAttributes.updateAllByQuery(
      tenantId,
      { bootConfigId: null },
      {
        where: {
          ocppConnectionName: ocppConnectionName,
        },
      },
    );
    // Assigns variables, or throws an error if variable with id does not exist
    for (const setVariableId of setVariableIds) {
      const setVariable: VariableAttribute | undefined = await this.variableAttributes.updateByKey(
        tenantId,
        { bootConfigId },
        setVariableId.toString(),
      );
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

export default SequelizeBootRepository;
