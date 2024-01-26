// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ICrudRepository, SystemConfig } from "@citrineos/base";
import { Model, Sequelize } from "sequelize-typescript";
import { DefaultSequelizeInstance } from "../util";
import { ILogObj, Logger } from "tslog";

export abstract class SequelizeRepository<T extends Model<any, any>> implements ICrudRepository<T> {

    protected s: Sequelize

    constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
        this.s = sequelizeInstance || DefaultSequelizeInstance.getInstance(config, logger);
    }

    create(value: T): Promise<T | undefined> {
        return value.save();
    }

    createByKey(value: T, key: string): Promise<T> {
        value.setDataValue("id", key);
        return value.save();
    }

    readByKey(key: string, namespace: string): Promise<T> {
        return this.s.models[namespace].findOne({ where: { id: key } })
            .then(row => (row as T));
    }

    readByQuery(query: object, namespace: string): Promise<T> {
        return this.s.models[namespace].findOne(query)
            .then(row => (row as T));
    }

    readAllByQuery(query: object, namespace: string): Promise<Array<T>> {
        return this.s.models[namespace].findAll(query)
            .then(row => (row as T[]));
    }

    updateByKey(value: T, key: string, namespace: string): Promise<T | undefined> {
        return this.readByKey(key, namespace).then(model => {
            return this._updateModel(value, model)?.save();
        });
    }

    updateByQuery(value: T, query: object, namespace: string): Promise<T | undefined> {
        return this.readByQuery(query, namespace).then(model => {
            return this._updateModel(value, model)?.save();
        });
    }

    updateByModel(value: T, model: T): Promise<T> | undefined {
        return this._updateModel(value, model)?.save();
    }

    deleteByKey(key: string, namespace: string): Promise<boolean> {
        return this.s.models[namespace].destroy({ where: { id: key } })
            .then(count => count > 0);
    }

    deleteAllByQuery(query: object, namespace: string): Promise<number> {
        return this.s.models[namespace].destroy(query);
    }

    existsByKey(key: string, namespace: string): Promise<boolean> {
        return this.s.models[namespace].findOne({ where: { id: key } })
            .then(row => row !== null);
    }

    existsByQuery(query: object, namespace: string): Promise<boolean> {
        return this.s.models[namespace].findOne(query)
            .then(row => row !== null);
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
            for (const k in value.dataValues) {
                model.setDataValue(k, value.getDataValue(k));
            }
            return model;
        }
    }
}