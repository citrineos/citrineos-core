// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { EventEmitter } from 'events';

/**
 * Represents a generic CRUD repository.
 *
 * @template T - The type of the values stored in the repository.
 */
export abstract class CrudRepository<T> extends EventEmitter {


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
    this.emit('created', result);
    return result;
  }
  abstract _create(value: T, namespace?: string): Promise<T>;

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
    this.emit('created', result);
    return result;
  }
  abstract _createByKey(
    value: T,
    key: string,
    namespace?: string,
  ): Promise<T>;

  /**
   * Reads a value from storage based on the given key.
   *
   * @param key - The key to look up in storage.
   * @param namespace - Optional namespace for the key.
   * @returns A promise that resolves to the value associated with the key, or undefined if the key does not exist.
   */
  abstract readByKey(key: string, namespace?: string): Promise<T | undefined>;

  /**
   * Reads values from storage based on the given query.
   *
   * @param query - The query to use.
   * @param namespace - Optional namespace for the query.
   * @returns A promise that resolves to the values associated with the query.
   */
  abstract readAllByQuery(query: object, namespace?: string): Promise<T[]>;

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
    this.emit('updated', result);
    return result;
  }
  abstract _updateByKey(
    value: Partial<T>,
    key: string,
    namespace?: string,
  ): Promise<T | undefined>;

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
  ): Promise<T[] | undefined> {
    const result = await this._updateAllByQuery(value, query, namespace);
    this.emit('updated', result);
    return result;
  }
  abstract _updateAllByQuery(
    value: Partial<T>,
    query: object,
    namespace?: string,
  ): Promise<T[]>;

  /**
   * Creates or updates an entry in the database depending on whether the value matches any unique indices.
   * If no namespace is provided, the default namespace is used.
   *
   * @param value - The value of the entry.
   * @param namespace - The optional namespace to create the entry in.
   * @returns A Promise that resolves to an array where the first element is the result of the upsert, and the second element is a boolean indicating whether the entry was created.
   */
  public async upsert(value: T, namespace?: string): Promise<[T, boolean]> {
    const result = await this._upsert(value, namespace);
    this.emit('upserted', result);
    return result;
  }
  abstract _upsert(value: T, namespace?: string): Promise<[T, boolean]>;

  /**
   * Deletes a key from the specified namespace.
   * If no namespace is provided, the key is deleted from the default namespace.
   *
   * @param key - The key to delete.
   * @param namespace - Optional. The namespace from which to delete the key.
   * @returns A Promise that resolves to the deleted entry, or undefined there was no matching entry.
   */
  public async deleteByKey(key: string, namespace?: string): Promise<T | undefined> {
    const result = await this._deleteByKey(key, namespace);
    this.emit('deleted', result);
    return result;
  }
  abstract _deleteByKey(key: string, namespace?: string): Promise<T | undefined>;

  /**
   * Deletes all values associated with a query from the specified namespace.
   * If no namespace is provided, the values are deleted from the default namespace.
   *
   * @param query - The query to use.
   * @param namespace - Optional. The namespace from which to delete the values.
   * @returns A Promise that resolves to the deleted entries.
   */
  public async deleteAllByQuery(query: object,namespace?: string): Promise<T[]> {
    const result = await this._deleteAllByQuery(query, namespace);
    this.emit('deleted', result);
    return result;
  }
  abstract _deleteAllByQuery(query: object, namespace?: string): Promise<T[]>;

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
}
