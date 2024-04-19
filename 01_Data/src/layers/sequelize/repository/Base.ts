// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type ICrudRepository, type SystemConfig } from '@citrineos/base';
import { type Model, type Sequelize } from 'sequelize-typescript';
import { DefaultSequelizeInstance } from '../util';
import { type ILogObj, type Logger } from 'tslog';

export abstract class SequelizeRepository<T extends Model<any, any>> implements ICrudRepository<T> {
  protected s: Sequelize;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    this.s = sequelizeInstance ?? DefaultSequelizeInstance.getInstance(config, logger);
  }

  async create(value: T): Promise<T | undefined> {
    return await value.save();
  }

  async createByKey(value: T, key: string): Promise<T> {
    value.setDataValue('id', key);
    return await value.save();
  }

  async readByKey(key: string, namespace: string): Promise<T> {
    return await this.s.models[namespace].findOne({ where: { id: key } }).then((row) => row as T);
  }

  async readByQuery(query: object, namespace: string): Promise<T> {
    return await this.s.models[namespace].findOne(query).then((row) => row as T);
  }

  async readAllByQuery(query: object, namespace: string): Promise<T[]> {
    return await this.s.models[namespace].findAll(query).then((row) => row as T[]);
  }

  async updateByKey(value: T, key: string, namespace: string): Promise<T | undefined> {
    return await this.readByKey(key, namespace).then(async (model) => await this._updateModel(value, model)?.save());
  }

  async updateByQuery(value: T, query: object, namespace: string): Promise<T | undefined> {
    return await this.readByQuery(query, namespace).then(async (model) => await this._updateModel(value, model)?.save());
  }

  updateByModel(value: T, model: T): Promise<T> | undefined {
    return this._updateModel(value, model)?.save();
  }

  async deleteByKey(key: string, namespace: string): Promise<boolean> {
    return await this.s.models[namespace].destroy({ where: { id: key } }).then((count) => count > 0);
  }

  async deleteAllByQuery(query: object, namespace: string): Promise<number> {
    return await this.s.models[namespace].destroy(query);
  }

  async existsByKey(key: string, namespace: string): Promise<boolean> {
    return await this.s.models[namespace].findOne({ where: { id: key } }).then((row) => row !== null);
  }

  async existsByQuery(query: object, namespace: string): Promise<boolean> {
    return await this.s.models[namespace].findOne(query).then((row) => row !== null);
  }

  /**
   * Delta updates the model with the provided value.
   *
   * @param {T} value - The new value to update the model with.
   * @param {T} model - The model to be updated.
   * @return {T | undefined} The updated model, or undefined if the provided model is null.
   */
  protected _updateModel(value: T, model: T): T | undefined {
    if (model !== null) {
      Object.keys(value.dataValues).forEach((key) => {
        model.setDataValue(key, value.getDataValue(key));
      });
      return model;
    }
  }
}
