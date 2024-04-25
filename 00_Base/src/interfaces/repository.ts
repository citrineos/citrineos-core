// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * Represents a generic CRUD repository.
 *
 * @template T - The type of the values stored in the repository.
 */
export interface ICrudRepository<T> {
  /**
   * Creates a new entry in the database with the specified value.
   * If a namespace is provided, the entry will be created within that namespace.
   *
   * @param value - The value of the entry.
   * @param namespace - The optional namespace to create the entry in.
   * @returns A Promise that resolves to the created entry, or undefined if an error occurred.
   */
  create(value: T, namespace?: string): Promise<T | undefined>;

  /**
   * Creates a new entry in the database with the specified value and key.
   * If a namespace is provided, the entry will be created within that namespace.
   *
   * @param value - The value of the entry.
   * @param key - The key of the entry.
   * @param namespace - The optional namespace to create the entry in.
   * @returns A Promise that resolves to the created entry, or undefined if an error occurred.
   */
  createByKey?(
    value: T,
    key: string,
    namespace?: string,
  ): Promise<T | undefined>;

  /**
   * Reads a value from storage based on the given key.
   *
   * @param key - The key to look up in storage.
   * @param namespace - Optional namespace for the key.
   * @returns A promise that resolves to the value associated with the key, or undefined if the key does not exist.
   */
  readByKey?(key: string, namespace?: string): Promise<T | undefined>;

  /**
   * Reads a value from storage based on the given query.
   *
   * @param query - The query to use.
   * @param namespace - Optional namespace for the query.
   * @returns A promise that resolves to the value associated with the query, or undefined if the value does not exist.
   */
  readByQuery(query: object, namespace?: string): Promise<T | undefined>;

  /**
   * Updates the value associated with the given key in the specified namespace.
   * If no namespace is provided, the default namespace is used.
   *
   * @param value - The new value to associate with the key.
   * @param key - The key to update.
   * @param namespace - The namespace in which to update the key.
   * @returns A promise that resolves to the updated value, or undefined if the key does not exist.
   */
  updateByKey?(
    value: T,
    key: string,
    namespace?: string,
  ): Promise<T | undefined>;

  /**
   * Updates the value associated with the given query in the specified namespace.
   * If no namespace is provided, the default namespace is used.
   *
   * @param value - The new value to associate with the query.
   * @param query - The query to use.
   * @param namespace - Optional namespace for the kqueryey.
   * @returns A promise that resolves to the value associated with the key, or undefined if the key does not exist.
   */
  updateByQuery(
    value: T,
    query: object,
    namespace?: string,
  ): Promise<T | undefined>;

  /**
   * Deletes a key from the specified namespace.
   * If no namespace is provided, the key is deleted from the default namespace.
   *
   * @param key - The key to delete.
   * @param namespace - Optional. The namespace from which to delete the key.
   * @returns A Promise that resolves to a boolean indicating whether the key was successfully deleted.
   */
  deleteByKey?(key: string, namespace?: string): Promise<boolean>;

  /**
   * Deletes all values associated with a query from the specified namespace.
   * If no namespace is provided, the values are deleted from the default namespace.
   *
   * @param query - The query to use.
   * @param namespace - Optional. The namespace from which to delete the values.
   * @returns A Promise that resolves to the number of rows successfully deleted.
   */
  deleteAllByQuery(query: object, namespace?: string): Promise<number>;

  /**
   * Checks if a key exists in the specified namespace.
   * If no namespace is provided, the key is checked in the default namespace.
   *
   * @param key - The key to check.
   * @param namespace - Optional. The namespace in which to check the key.
   * @returns A Promise that resolves to a boolean indicating whether the key exists.
   */
  existsByKey?(key: string, namespace?: string): Promise<boolean>;

  /**
   * Checks if a specific value associated with a query exists in the specified namespace.
   * If no namespace is provided, the query is checked in the default namespace.
   *
   * @param query - The query to use.
   * @param namespace - Optional. The namespace in which to check the query.
   * @returns A Promise that resolves to a boolean indicating whether the value exists.
   */
  existsByQuery(query: object, namespace?: string): Promise<boolean>;
}
