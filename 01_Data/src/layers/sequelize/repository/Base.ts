// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, type SystemConfig } from '@citrineos/base';
import { type Model, type Sequelize } from 'sequelize-typescript';
import { DefaultSequelizeInstance } from '../util';
import { type ILogObj, type Logger } from 'tslog';
import { Attributes, FindOptions, ModelStatic, UpdateOptions } from 'sequelize';

export class SequelizeRepository<T extends Model<any, any>> extends CrudRepository<T> {
  protected s: Sequelize;
  private namespace: string;

  constructor(config: SystemConfig, namespace: string, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super();
    this.s = sequelizeInstance ?? DefaultSequelizeInstance.getInstance(config, logger);
    this.namespace = namespace;
  }

  protected async _create(value: T): Promise<T> {
    return await value.save();
  }

  protected async _createByKey(value: T, key: string): Promise<T> {
    value.setDataValue('id', key);
    return await value.save();
  }

  async readByKey(key: string): Promise<T | undefined> {
    return await this.s.models[this.namespace].findOne({ where: { id: key } }).then((row) => row as T);
  }

  async readAllByQuery(query: object): Promise<T[]> {
    return await this.s.models[this.namespace].findAll(query as FindOptions<any>).then((row) => row as T[]);
  }

  protected async _readOrCreateByQuery(query: object): Promise<[T, boolean]> {
    return await this.s.models[this.namespace].findOrCreate(query as FindOptions<any>).then((result) => [result[0] as T, result[1]]);
  }

  protected async _updateByKey(value: Partial<T>, key: string): Promise<T | undefined> {
    return await this._updateAllByQuery(value, { where: { id: key } }).then((rows) => (rows.length === 1 ? rows[0] : undefined));
  }

  protected async _updateAllByQuery(value: Partial<T>, query: object): Promise<T[]> {
    const updateOptions = query as UpdateOptions<any>;
    updateOptions.returning = true;
    // Lengthy type conversion to satisfy sequelize-typescript
    return await (this.s.models[this.namespace] as ModelStatic<T>)
      .update(value, updateOptions as Omit<UpdateOptions<Attributes<T>>, 'returning'> & { returning: Exclude<UpdateOptions<Attributes<T>>['returning'], undefined | false> })
      .then((result) => result[1] as T[]);
  }

  protected async _upsert(value: T): Promise<[T, boolean]> {
    // There will be an exception if sql attempts to create and value is missing required fields.
    // However, the typing of upsert requires a Partial. This is a workaround.
    // The created boolean (second element of the result) can only be null if the SQL engine in use is SQLite. In that case, it is assumed the entry was created.
    // This is a compromise for compilation's sake, it's highly recommended you do NOT use SQLite.
    return await this.s.models[this.namespace].upsert(value as Partial<T>).then((result) => [result[0] as T, result[1] == null ? true : result[1]]);
  }

  protected async _deleteByKey(key: string): Promise<T | undefined> {
    return this.s.transaction(async (t) => {
      const entryToDelete = await this.s.models[this.namespace].findOne({ where: { id: key } }).then((row) => row as T);
      const deletedCount = await this.s.models[this.namespace].destroy({ where: { id: key } });
      if (entryToDelete && deletedCount === 1) {
        return entryToDelete;
      } else if (!entryToDelete && deletedCount === 0) {
        return undefined;
      } else {
        throw new Error(`Deleted ${deletedCount} entries, expected ${entryToDelete ? 1 : 0}`);
      }
    });
  }

  protected async _deleteAllByQuery(query: object): Promise<T[]> {
    return this.s.transaction(async (t) => {
      const entriesToDelete = await this.s.models[this.namespace].findAll(query).then((rows) => rows as T[]);
      const deletedCount = await this.s.models[this.namespace].destroy(query);
      if (entriesToDelete.length === deletedCount) {
        return entriesToDelete;
      } else {
        throw new Error(`Deleted ${deletedCount} entries, expected ${entriesToDelete.length}`);
      }
    });
  }

  async existsByKey(key: string): Promise<boolean> {
    return await this.s.models[this.namespace].findOne({ where: { id: key } }).then((row) => row !== null);
  }

  async existByQuery(query: object): Promise<number> {
    return await this.s.models[this.namespace].findAll(query).then((row) => row.length);
  }
}
