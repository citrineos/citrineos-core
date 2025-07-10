// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, BootstrapConfig, type BootConfig, OCPP2_0_1 } from '@citrineos/base';
import { type IBootRepository } from '../../../interfaces';
import { Boot } from '../model/Boot';
import { VariableAttribute } from '../model/DeviceModel';
import { SequelizeRepository } from '..';
import { Logger, ILogObj } from 'tslog';
import { Sequelize } from 'sequelize-typescript';

export class SequelizeBootRepository extends SequelizeRepository<Boot> implements IBootRepository {
  variableAttributes: CrudRepository<VariableAttribute>;

  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    sequelizeInstance?: Sequelize,
    variableAttributes?: CrudRepository<VariableAttribute>,
  ) {
    super(config, Boot.MODEL_NAME, logger, sequelizeInstance);
    this.variableAttributes = variableAttributes
      ? variableAttributes
      : new SequelizeRepository<VariableAttribute>(
          config,
          VariableAttribute.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
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
    status: OCPP2_0_1.RegistrationStatusEnumType,
    statusInfo: OCPP2_0_1.StatusInfoType | undefined,
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
    stationId: string,
    bootConfigId: string,
  ): Promise<VariableAttribute[]> {
    const managedSetVariables: VariableAttribute[] = [];
    // Unassigns variables
    await this.variableAttributes.updateAllByQuery(
      tenantId,
      { bootConfigId: null },
      {
        where: {
          stationId,
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
