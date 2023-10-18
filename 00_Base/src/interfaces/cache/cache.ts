/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { ClassConstructor } from "class-transformer";

export enum CacheNamespace {
  CentralSystem = "csms",
  ChargingStation = "cs",
  Transactions = "tx",
  Connections = "conn",
  Other = "other"
}

/**
 * Interface for cache
 */
export interface ICache {
  exists(key: string, namespace?: string): Promise<boolean>;
  remove(key: string, namespace?: string): Promise<boolean>;

  /**
   * Gets a value asynchronously from the underlying cache.
   * 
   * @param {string} key - The key for the value.
   * @param {string} [namespace] - The namespace for the key.
   * @returns {Promise<string | null>} - Returns the value as string or null if the key does not exist.
   * */

  get<T>(key: string, namespace?: string, classConstructor?: () => ClassConstructor<T>): Promise<T | null>;

  /**
   * Gets a value synchronously from the underlying cache.
   * 
   * Note: The concrete implementation of this method might use run loop modification to achieve synchronous behavior.
   * 
   * @param {string} key - The key for the value.
   * @param {string} [namespace] - The namespace for the key.
   * @returns {string | null} - Returns the value as string or null if the key does not exist.
   */
  getSync<T>(key: string, namespace?: string, classConstructor?: () => ClassConstructor<T>): T | null;

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
   * Sets a value synchronously in the underlying cache.
   * 
   * Note: The concrete implementation of this method might use run loop modification to achieve synchronous behavior.
   * 
   * @param {string} key - The key for the value.
   * @param {string} value - The value to set.
   * @param {string} [namespace] - The namespace for the key.
   * @param {number} [expireSeconds] - The number of seconds after which the key should expire.
   * @returns {boolean} - Returns true if the value was set successfully.
   */
  setSync(key: string, value: string, namespace?: string, expireSeconds?: number): boolean;
}
