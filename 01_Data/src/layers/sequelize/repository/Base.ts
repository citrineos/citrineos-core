// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, type SystemConfig } from '@citrineos/base';
import { type Model, type Sequelize } from 'sequelize-typescript';
import { DefaultSequelizeInstance } from '../util';
import { type ILogObj, Logger } from 'tslog';
import {
  AggregateOptions,
  Attributes,
  FindAndCountOptions,
  FindOptions,
  ModelStatic,
  QueryTypes,
  UpdateOptions,
} from 'sequelize';

export class SequelizeRepository<T extends Model<any, any>> extends CrudRepository<T> {
  protected s: Sequelize;
  protected namespace: string;
  protected logger: Logger<ILogObj>;

  constructor(
    config: SystemConfig,
    namespace: string,
    logger?: Logger<ILogObj>,
    sequelizeInstance?: Sequelize,
  ) {
    super();
    this.s = sequelizeInstance ?? DefaultSequelizeInstance.getInstance(config, logger);
    this.namespace = namespace;
    this.logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async readByKey(key: string | number): Promise<T | undefined> {
    return await this.s.models[this.namespace].findByPk(key).then((row) => row as T);
  }

  async readAllByQuery(query: object): Promise<T[]> {
    return await this.s.models[this.namespace]
      .findAll(query as FindOptions<any>)
      .then((row) => row as T[]);
  }

  async readAllBySqlString(sqlString: string): Promise<object[]> {
    return await this.s.query(`${sqlString}`, { type: QueryTypes.SELECT });
  }

  async readNextValue(columnName: string, query?: object, startValue?: number): Promise<number> {
    const options = query ? (query as AggregateOptions<any>) : undefined;
    const maxValue = await this.s.models[this.namespace].max(columnName, options);
    if (maxValue === null || maxValue === undefined) {
      // maxValue can be 0, so we need to specifically check for null or undefined
      return startValue ?? 1;
    }
    if (typeof maxValue !== 'number' || isNaN(maxValue)) {
      throw new Error(`Max value ${maxValue} on ${columnName} is invalid.`);
    }
    return maxValue + 1;
  }

  async existsByKey(key: string): Promise<boolean> {
    return await this.s.models[this.namespace].findByPk(key).then((row) => row !== null);
  }

  async existByQuery(query: object): Promise<number> {
    return await this.s.models[this.namespace].findAll(query).then((row) => row.length);
  }

  async findAndCount(
    options: Omit<FindAndCountOptions<Attributes<T>>, 'group'>,
  ): Promise<{ rows: T[]; count: number }> {
    return (this.s.models[this.namespace] as ModelStatic<T>).findAndCountAll(options);
  }

  protected async _create(value: T): Promise<T> {
    return await value.save();
  }

  protected async _bulkCreate(values: T[]): Promise<T[]> {
    return await (this.s.models[this.namespace] as ModelStatic<T>).bulkCreate(values as any);
  }

  protected async _createByKey(value: T, key: string): Promise<T> {
    const primaryKey = this.s.models[this.namespace].primaryKeyAttribute;
    value.setDataValue(primaryKey, key);
    return await value.save();
  }

  protected async _readOrCreateByQuery(query: object): Promise<[T, boolean]> {
    return await this.s.models[this.namespace]
      .findOrCreate(query as FindOptions<any>)
      .then((result) => [result[0] as T, result[1]]);
  }

  protected async _updateByKey(value: Partial<T>, key: string): Promise<T | undefined> {
    const primaryKey = this.s.models[this.namespace].primaryKeyAttribute;
    return await this._updateAllByQuery(value, { where: { [primaryKey]: key } }).then((rows) =>
      rows && rows.length === 1 ? rows[0] : undefined,
    );
  }

  protected async _updateAllByQuery(value: Partial<T>, query: object): Promise<T[]> {
    const updateOptions = query as UpdateOptions<any>;
    updateOptions.returning = true;
    // Lengthy type conversion to satisfy sequelize-typescript
    return await (this.s.models[this.namespace] as ModelStatic<T>)
      .update(
        value,
        updateOptions as Omit<UpdateOptions<Attributes<T>>, 'returning'> & {
          returning: Exclude<UpdateOptions<Attributes<T>>['returning'], undefined | false>;
        },
      )
      .then((result) => result[1] as T[]);
  }

  protected async _deleteByKey(key: string): Promise<T | undefined> {
    return this.s.transaction(async (transaction) => {
      const entryToDelete = await this.s.models[this.namespace]
        .findByPk(key, { transaction })
        .then((row) => row as T);

      if (entryToDelete) {
        await entryToDelete.destroy({ transaction: transaction });
        return entryToDelete;
      } else {
        return undefined;
      }
    });
  }

  protected async _deleteAllByQuery(query: object): Promise<T[]> {
    return this.s.transaction(async (transaction) => {
      const entriesToDelete = await this.s.models[this.namespace]
        .findAll({
          ...query,
          transaction,
        })
        .then((rows) => rows as T[]);
      const deletedCount = await this.s.models[this.namespace].destroy({ ...query, transaction });
      if (entriesToDelete.length === deletedCount) {
        return entriesToDelete;
      } else {
        throw new Error(`Deleted ${deletedCount} entries, expected ${entriesToDelete.length}`);
      }
    });
  }
}
