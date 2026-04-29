// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type BootstrapConfig, CrudRepository } from '@citrineos/base';
import type {
  AggregateOptions,
  Attributes,
  FindAndCountOptions,
  FindOptions,
  ModelStatic as SequelizeModelStatic,
  WhereOptions,
} from 'sequelize';
import { QueryTypes } from 'sequelize';
import { type Model, type ModelStatic, type Sequelize } from 'sequelize-typescript';
import { type ILogObj, Logger } from 'tslog';
import { DefaultSequelizeInstance } from '../util.js';

export abstract class SequelizeTenantJunctionRepository<
  T extends Model<any, any>,
> extends CrudRepository<T> {
  protected s: Sequelize;
  protected namespace: string;
  protected logger: Logger<ILogObj>;

  constructor(
    config: BootstrapConfig,
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

  protected abstract getJunctionModel(): ModelStatic<Model>;
  protected abstract getJunctionForeignKey(): string;

  private _model<M extends Model = T>(namespace: string): SequelizeModelStatic<M> {
    return this.s.models[namespace] as unknown as SequelizeModelStatic<M>;
  }

  private _junctionModel(): SequelizeModelStatic<Model> {
    return this.getJunctionModel() as unknown as SequelizeModelStatic<Model>;
  }

  private _injectJunctionInclude(query: object, tenantId: number): object {
    const existing = (query as any).include ?? [];
    return {
      ...query,
      include: [
        ...(Array.isArray(existing) ? existing : [existing]),
        {
          model: this.getJunctionModel(),
          required: true,
          where: { tenantId },
          attributes: [],
        },
      ],
    };
  }

  async readByKey(
    tenantId: number,
    key: string | number,
    namespace: string = this.namespace,
  ): Promise<T | undefined> {
    const row = (await this._model(namespace).findByPk(key)) as T | null;
    console.log('!!! row !!', row);
    if (!row) return undefined;
    const fk = this.getJunctionForeignKey();
    console.log('!!! fk !!', fk);
    const junctionRow = await this._junctionModel().findOne({ where: { [fk]: key, tenantId } });
    console.log('!!! junctionRow !!', junctionRow);
    return junctionRow ? row : undefined;
  }

  async readAllByQuery(
    tenantId: number,
    query: object,
    namespace: string = this.namespace,
  ): Promise<T[]> {
    return await this._model(namespace)
      .findAll(this._injectJunctionInclude(query, tenantId) as FindOptions<any>)
      .then((rows) => rows as T[]);
  }

  async readAllBySqlString(
    tenantId: number,
    sqlString: string,
    _namespace: string = this.namespace,
  ): Promise<object[]> {
    return await this.s.query(`${sqlString}`, { type: QueryTypes.SELECT });
  }

  async readNextValue(
    tenantId: number,
    columnName: string,
    query?: object,
    startValue?: number,
    namespace: string = this.namespace,
  ): Promise<number> {
    const options = query ? (query as AggregateOptions<any>) : undefined;
    const maxValue = await this._model(namespace).max(columnName, options);
    if (maxValue === null || maxValue === undefined) {
      return startValue ?? 1;
    }
    if (typeof maxValue !== 'number' || isNaN(maxValue)) {
      throw new Error(`Max value ${maxValue} on ${columnName} is invalid.`);
    }
    return maxValue + 1;
  }

  async existsByKey(
    tenantId: number,
    key: string,
    namespace: string = this.namespace,
  ): Promise<boolean> {
    const fk = this.getJunctionForeignKey();
    const junctionRow = await this._junctionModel().findOne({ where: { [fk]: key, tenantId } });
    return junctionRow !== null;
  }

  async existByQuery(
    tenantId: number,
    query: object,
    namespace: string = this.namespace,
  ): Promise<number> {
    return await this._model(namespace)
      .findAll(query as FindOptions<any>)
      .then((rows) => rows.length);
  }

  async findAndCount(
    tenantId: number,
    options: Omit<FindAndCountOptions<Attributes<T>>, 'group'>,
    namespace: string = this.namespace,
  ): Promise<{ rows: T[]; count: number }> {
    return this._model<T>(namespace).findAndCountAll(options) as Promise<{
      rows: T[];
      count: number;
    }>;
  }

  protected async _create(
    tenantId: number,
    value: T,
    _namespace: string = this.namespace,
  ): Promise<T> {
    console.log('!!! _create', tenantId, value, _namespace);
    const saved = await value.save();
    const pk = this._model(_namespace).primaryKeyAttribute;
    const fk = this.getJunctionForeignKey();
    await this._junctionModel().create({ [fk]: saved.get(pk), tenantId });
    return saved;
  }

  protected async _bulkCreate(
    tenantId: number,
    values: T[],
    namespace: string = this.namespace,
  ): Promise<T[]> {
    return (await this._model<T>(namespace).bulkCreate(values as any)) as T[];
  }

  protected async _createByKey(
    tenantId: number,
    value: T,
    key: string,
    namespace: string = this.namespace,
  ): Promise<T> {
    const model = this._model<T>(namespace);
    const primaryKey = model.primaryKeyAttribute;
    value.setDataValue(primaryKey, key);
    return (await model.create(value.toJSON())) as T;
  }

  protected async _readOrCreateByQuery(
    tenantId: number,
    query: object,
    namespace: string = this.namespace,
  ): Promise<[T, boolean]> {
    return await this._model<T>(namespace)
      .findOrCreate(query as FindOptions<any>)
      .then((result) => [result[0] as T, result[1]]);
  }

  protected async _updateByKey(
    tenantId: number,
    value: Partial<T>,
    key: string,
    namespace: string = this.namespace,
  ): Promise<T | undefined> {
    const fk = this.getJunctionForeignKey();
    const junctionRow = await this._junctionModel().findOne({ where: { [fk]: key, tenantId } });
    if (!junctionRow) return undefined;

    const model = this._model<T>(namespace);
    const pk = model.primaryKeyAttribute;
    const { tenantId: _ignored, ...safeValue } = value as any;
    const where: WhereOptions<any> = { [pk]: key };
    const row = await model.findOne({ where });
    if (!row) return undefined;

    await row.update(safeValue);
    return row.reload() as Promise<T>;
  }

  protected async _updateAllByQuery(
    tenantId: number,
    value: Partial<T>,
    query: object,
    namespace: string = this.namespace,
  ): Promise<T[]> {
    const model = this._model<T>(namespace);
    const rows = (await model.findAll(
      this._injectJunctionInclude(query, tenantId) as FindOptions<any>,
    )) as T[];

    if (rows.length === 0) return [];

    for (const row of rows) {
      await row.update(value);
    }

    return Promise.all(rows.map((r) => r.reload() as Promise<T>));
  }

  protected async _deleteByKey(
    tenantId: number,
    key: string,
    namespace: string = this.namespace,
  ): Promise<T | undefined> {
    return this.s.transaction(async (transaction) => {
      const fk = this.getJunctionForeignKey();
      const junctionRow = await this._junctionModel().findOne({
        where: { [fk]: key, tenantId },
        transaction,
      });
      if (!junctionRow) return undefined;
      await junctionRow.destroy({ transaction });

      const model = this._model<T>(namespace);
      const entryToDelete = (await model.findByPk(key, { transaction })) as T | null;

      if (entryToDelete) {
        await model.destroy({
          where: { [model.primaryKeyAttribute]: key } as WhereOptions<any>,
          transaction,
        });
        return entryToDelete;
      } else {
        return undefined;
      }
    });
  }

  protected async _deleteAllByQuery(
    tenantId: number,
    query: object,
    namespace: string = this.namespace,
  ): Promise<T[]> {
    return this.s.transaction(async (transaction) => {
      const model = this._model<T>(namespace);
      const pk = model.primaryKeyAttribute;
      const fk = this.getJunctionForeignKey();

      const entriesToDelete = await model
        .findAll({ ...(this._injectJunctionInclude(query, tenantId) as any), transaction })
        .then((rows) => rows as T[]);

      if (entriesToDelete.length === 0) return [];

      const ids = entriesToDelete.map((e) => e.get(pk));
      await this._junctionModel().destroy({ where: { [fk]: ids }, transaction });
      const deletedCount = await model.destroy({
        where: { [pk]: ids } as WhereOptions<any>,
        transaction,
      });

      if (entriesToDelete.length === deletedCount) {
        return entriesToDelete;
      } else {
        throw new Error(`Deleted ${deletedCount} entries, expected ${entriesToDelete.length}`);
      }
    });
  }
}
