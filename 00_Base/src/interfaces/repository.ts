// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { EventEmitter } from 'events';

export interface CrudEvent<T> {
  created: [T[]];
  updated: [T[]];
  deleted: [T[]];
}

/**
 * Represents a generic CRUD repository.
 *
 * @template T - The type of the values stored in the repository.
 */
export abstract class CrudRepository<T> extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * On method overridden to handle events from {@link CrudEvent}.
   * @param event The name of the event. Must be a key in {@link CrudEvent}.
   * @param listener The callback for the event. Argument types correspond to the contents of the event key in {@link CrudEvent}.
   *
   * @see {@link EventEmitter#on} for the original method.
   */
  on<K extends keyof CrudEvent<T>>(
    event: K,
    listener: (...args: CrudEvent<T>[K]) => void,
  ): this {
    return super.on(event, listener as (...args: any[]) => void);
  }

  /**
   * Emit method overridden to emit events from {@link CrudEvent}.
   * @param event The name of the event. Must be a key in {@link CrudEvent}.
   * @param args The arguments to pass with the event. Allowed types correspond to the contents of the event key in {@link CrudEvent}.
   *
   * @see {@link EventEmitter#emit} for the original method.
   */
  emit<K extends keyof CrudEvent<T>>(
    event: K,
    ...args: CrudEvent<T>[K]
  ): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Creates a new entry in the database with the specified value.
   * If a namespace is provided, the entry will be created within that namespace.
   *
   * @param value - The value of the entry.
   * @param namespace - The optional namespace to create the entry in.
   * @returns A Promise that resolves to the created entry.
   */
  public async create(value: T, namespace?: string): Promise<T> {
    const result = await this._create(value, namespace);
    this.emit('created', [result]);
    return result;
  }

  public async bulkCreate(values: T[], namespace?: string): Promise<T[]> {
    const result = await this._bulkCreate(values, namespace);
    this.emit('created', result);
    return result;
  }

  /**
   * Creates a new entry in the database with the specified value and key.
   * If a namespace is provided, the entry will be created within that namespace.
   *
   * @param value - The value of the entry.
   * @param key - The key of the entry.
   * @param namespace - The optional namespace to create the entry in.
   * @returns A Promise that resolves to the created entry.
   */
  public async createByKey(
    value: T,
    key: string,
    namespace?: string,
  ): Promise<T> {
    const result = await this._createByKey(value, key, namespace);
    this.emit('created', [result]);
    return result;
  }

  /**
   * Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.
   *
   * @param query - The query to use.
   * @param namespace - Optional namespace for the query.
   * @returns A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.
   */
  public async readOnlyOneByQuery(
    query: object,
    namespace?: string,
  ): Promise<T | undefined> {
    const results = await this.readAllByQuery(query, namespace);
    if (results.length > 1) {
      throw new Error(
        `More than one value found for query: ${JSON.stringify(query)}`,
      );
    }
    return results[0];
  }

  /**
   * Reads the first matching value from storage based on the given query, or creates a matching value if none exists.
   *
   * @param query - The query to use.
   * @param namespace - Optional namespace for the query.
   * @returns A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.
   */
  public async readOrCreateByQuery(
    query: object,
    namespace?: string,
  ): Promise<[T, boolean]> {
    const result = await this._readOrCreateByQuery(query, namespace);
    if (result[1]) {
      this.emit('created', [result[0]]);
    }
    return result;
  }

  /**
   * Updates the value associated with the given key in the specified namespace.
   * If no namespace is provided, the default namespace is used.
   *
   * @param value - The new value to associate with the key.
   * @param key - The key to update.
   * @param namespace - The namespace in which to update the key.
   * @returns A promise that resolves to the updated value, or undefined if the key does not exist.
   */
  public async updateByKey(
    value: Partial<T>,
    key: string,
    namespace?: string,
  ): Promise<T | undefined> {
    const result = await this._updateByKey(value, key, namespace);
    this.emit('updated', result ? [result] : []);
    return result;
  }

  /**
   * Updates the values associated with the given query in the specified namespace.
   * If no namespace is provided, the default namespace is used.
   *
   * @param value - The new value to associate with the query.
   * @param query - The query to use.
   * @param namespace - Optional namespace for the query.
   * @returns A promise that resolves to the updated values associated with the query.
   */
  public async updateAllByQuery(
    value: Partial<T>,
    query: object,
    namespace?: string,
  ): Promise<T[]> {
    const result = await this._updateAllByQuery(value, query, namespace);
    this.emit('updated', result);
    return result;
  }

  /**
   * Deletes a key from the specified namespace.
   * If no namespace is provided, the key is deleted from the default namespace.
   *
   * @param key - The key to delete.
   * @param namespace - Optional. The namespace from which to delete the key.
   * @returns A Promise that resolves to the deleted entry, or undefined there was no matching entry.
   */
  public async deleteByKey(
    key: string,
    namespace?: string,
  ): Promise<T | undefined> {
    const result = await this._deleteByKey(key, namespace);
    this.emit('deleted', result ? [result] : []);
    return result;
  }

  /**
   * Deletes all values associated with a query from the specified namespace.
   * If no namespace is provided, the values are deleted from the default namespace.
   *
   * @param query - The query to use.
   * @param namespace - Optional. The namespace from which to delete the values.
   * @returns A Promise that resolves to the deleted entries.
   */
  public async deleteAllByQuery(
    query: object,
    namespace?: string,
  ): Promise<T[]> {
    const result = await this._deleteAllByQuery(query, namespace);
    this.emit('deleted', result);
    return result;
  }

  /**
   * Reads a value from storage based on the given key.
   *
   * @param key - The key to look up in storage.
   * @param namespace - Optional namespace for the key.
   * @returns A promise that resolves to the value associated with the key, or undefined if the key does not exist.
   */
  abstract readByKey(
    key: string | number,
    namespace?: string,
  ): Promise<T | undefined>;

  /**
   * Reads values from storage based on the given query.
   *
   * @param query - The query to use.
   * @param namespace - Optional namespace for the query.
   * @returns A promise that resolves to the values associated with the query.
   */
  abstract readAllByQuery(query: object, namespace?: string): Promise<T[]>;

  /**
   * Attempts to read next id.
   *
   * @param columnName - The name of the column which needs a next value. The column must be integer.
   * @param query - The query to use.
   * @param startValue - If no existing value is found, this value will be used. By default, it is 1.
   * @param namespace - Optional namespace for the query.
   * @returns An integer that is the next id to use
   */
  abstract readNextValue(
    columnName: string,
    query?: object,
    startValue?: number,
    namespace?: string,
  ): Promise<number>;

  /**
   * Checks if a key exists in the specified namespace.
   * If no namespace is provided, the key is checked in the default namespace.
   *
   * @param key - The key to check.
   * @param namespace - Optional. The namespace in which to check the key.
   * @returns A Promise that resolves to a boolean indicating whether the key exists.
   */
  abstract existsByKey(key: string, namespace?: string): Promise<boolean>;

  /**
   * Checks how many values associated with a query exists in the specified namespace.
   * If no namespace is provided, the query is checked in the default namespace.
   *
   * @param query - The query to use.
   * @param namespace - Optional. The namespace in which to check the query.
   * @returns A Promise that resolves to the number of values matching the query.
   */
  abstract existByQuery(query: object, namespace?: string): Promise<number>;

  protected abstract _create(value: T, namespace?: string): Promise<T>;
  protected abstract _bulkCreate(value: T[], namespace?: string): Promise<T[]>;

  protected abstract _createByKey(
    value: T,
    key: string,
    namespace?: string,
  ): Promise<T>;

  protected abstract _readOrCreateByQuery(
    query: object,
    namespace?: string,
  ): Promise<[T, boolean]>;

  protected abstract _updateByKey(
    value: Partial<T>,
    key: string,
    namespace?: string,
  ): Promise<T | undefined>;

  protected abstract _updateAllByQuery(
    value: Partial<T>,
    query: object,
    namespace?: string,
  ): Promise<T[]>;

  protected abstract _deleteByKey(
    key: string,
    namespace?: string,
  ): Promise<T | undefined>;

  protected abstract _deleteAllByQuery(
    query: object,
    namespace?: string,
  ): Promise<T[]>;
}
