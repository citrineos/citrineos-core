// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { CrudRepository } from '@citrineos/base';
import type { BootCreate } from '@citrineos/types';
import type { IBootRepository } from '../../../interfaces/repositories.js';
import { Boot } from '../model/Boot.js';
import { VariableAttribute } from '../model/DeviceModel/VariableAttribute.js';
import { ChargingStation } from '../model/Location/index.js';
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
    value: BootCreate,
    key: string,
  ): Promise<Boot | undefined> {
    // A boot record cannot exist without its station: stationId is a non-null FK.
    const stationId = await this.findStationId(tenantId, key);
    if (stationId === undefined) {
      throw new Error(
        `Cannot store boot configuration: no charging station ${key} exists for tenant ${tenantId}`,
      );
    }

    let savedBootConfig: Boot | undefined;
    let created;
    await this.s.transaction(async (sequelizeTransaction) => {
      const [boot, bootCreated] = await this.readOrCreateByQuery(tenantId, {
        where: {
          tenantId,
          stationId,
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

  async updateByKey(tenantId: number, value: object, key: string): Promise<Boot | undefined> {
    return await this._updateByKey(tenantId, value, key);
  }

  // Callers address a boot record by its station's `ocppConnectionName`, but the
  // record is keyed by `stationId`. These replace the inherited primary-key (and
  // tenant-blind) lookups, resolving the station within the tenant first.
  async readByKey(tenantId: number, key: string): Promise<Boot | undefined> {
    const stationId = await this.findStationId(tenantId, key);
    if (stationId === undefined) return undefined;
    return await this.readOnlyOneByQuery(tenantId, { where: { stationId } });
  }

  async existsByKey(tenantId: number, key: string): Promise<boolean> {
    return (await this.readByKey(tenantId, key)) !== undefined;
  }

  protected async _updateByKey(
    tenantId: number,
    value: Partial<Boot>,
    key: string,
  ): Promise<Boot | undefined> {
    const stationId = await this.findStationId(tenantId, key);
    if (stationId === undefined) return undefined;

    // Never let a caller move a boot record between tenants or stations.
    const { tenantId: _tenantId, stationId: _stationId, ...safeValue } = value as any;
    const [updated] = await this._updateAllByQuery(tenantId, safeValue, { where: { stationId } });
    return updated;
  }

  protected async _deleteByKey(tenantId: number, key: string): Promise<Boot | undefined> {
    const stationId = await this.findStationId(tenantId, key);
    if (stationId === undefined) return undefined;
    const [deleted] = await this._deleteAllByQuery(tenantId, { where: { stationId } });
    return deleted;
  }

  /**
   * Private Methods
   */

  // Resolves a tenant-scoped `ocppConnectionName` to a ChargingStation id.
  private async findStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | undefined> {
    const station = await ChargingStation.findOne({
      where: { ocppConnectionName, tenantId },
      attributes: ['id'],
    });
    return station?.id;
  }

  private async manageSetVariables(
    tenantId: number,
    setVariableIds: number[],
    ocppConnectionName: string,
    bootConfigId: number,
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
