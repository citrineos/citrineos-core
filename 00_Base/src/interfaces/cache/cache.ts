// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ClassConstructor } from 'class-transformer';

/**
 * Interface for cache
 * Implementers SHALL ensure minimal logic outside of promise resolution or async function to prevent lag
 * Users of this interface can assume these methods behave asynchronously
 */
export interface ICache {
  exists(key: string, namespace?: string): Promise<boolean>;
  remove(key: string, namespace?: string): Promise<boolean>;

  /**
   * Monitors a key for potential changes to its value.
   * If key-value does not exist this method will wait for it to exist or return null at the end of the wait period.
   * If value is removed, the method will return null.
   *
   * @param {string} key - The key for the value.
   * @param {number} [waitSeconds] - The number of seconds after which the method should return if the value has not been modified by then.
   * @param {string} [namespace] - The namespace for the key.
   * @returns {Promise<string | null>} Returns the value as string once it is modified or waitSeconds has elapsed; or null if the key does not exist.
   * */
  onChange<T>(
    key: string,
    waitSeconds: number,
    namespace?: string,
    classConstructor?: () => ClassConstructor<T>,
  ): Promise<T | null>;

  /**
   * Gets a value asynchronously from the underlying cache.
   *
   * @param {string} key - The key for the value.
   * @param {string} [namespace] - The namespace for the key.
   * @returns {Promise<string | null>} - Returns the value as string or null if the key does not exist.
   * */

  get<T>(
    key: string,
    namespace?: string,
    classConstructor?: () => ClassConstructor<T>,
  ): Promise<T | null>;

  /**
   * Sets a value asynchronously in the underlying cache.
   *
   * @param {string} key - The key for the value.
   * @param {string} value - The value to set.
   * @param {string} [namespace] - The namespace for the key.
   * @param {number} [expireSeconds] - The number of seconds after which the key should expire.
   * @returns {Promise<boolean>} - Returns true if the value was set successfully.
   * */
  set(key: string, value: string, namespace?: string, expireSeconds?: number): Promise<boolean>;

  /**
   * Sets a value asynchronously in the underlying cache if it doesn't exist. Returns false if the key already exists.
   *
   * @param {string} key - The key for the value.
   * @param {string} value - The value to set.
   * @param {string} [namespace] - The namespace for the key.
   * @param {number} [expireSeconds] - The number of seconds after which the key should expire.
   * @returns {Promise<boolean>} - Returns true if the value was set successfully.
   * */
  setIfNotExist(
    key: string,
    value: string,
    namespace?: string,
    expireSeconds?: number,
  ): Promise<boolean>;
}
