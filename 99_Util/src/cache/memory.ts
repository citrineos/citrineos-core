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

import { ICache } from "@citrineos/base";
import { ClassConstructor, plainToInstance } from "class-transformer";

/**
 * Implementation of cache interface with memory storage
 */
export class MemoryCache implements ICache {

  private _cache: Map<string, string>;
  private _timeoutMap: Map<string, NodeJS.Timeout>;

  constructor() {
    this._cache = new Map();
    this._timeoutMap = new Map();
  }

  exists(key: string, namespace?: string): Promise<boolean> {
    namespace = namespace || "default";
    const namespaceKey = `${namespace}:${key}`;
    return Promise.resolve(this._cache.has(namespaceKey));
  }

  remove(key: string, namespace?: string): Promise<boolean> {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;
    return Promise.resolve(this._cache.delete(key));
  }

  get<T>(key: string, namespace?: string, classConstructor?: () => ClassConstructor<T>): Promise<T | null> {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;
    return Promise.resolve(this._cache.get(key)).then((result) => {
      if (result) {
        if (classConstructor) {
          return plainToInstance(classConstructor(), JSON.parse(result));
        }
        return result as T;
      }
      return null;
    });
  }

  getSync<T>(key: string, namespace?: string, classConstructor?: () => ClassConstructor<T>): T | null {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;
    const value = this._cache.get(key);
    if (value) {
      if (classConstructor) {
        return plainToInstance(classConstructor(), JSON.parse(value));
      }
      return value as T;
    } else {
      return null;
    }
  }

  set(key: string, value: string, namespace?: string, expireSeconds?: number): Promise<boolean> {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;
    this._cache.set(key, value);
    if (this._timeoutMap.has(key)) {
      clearTimeout(this._timeoutMap.get(key));
    }
    if (expireSeconds) {
      this._timeoutMap.set(namespaceKey, setTimeout(() => {
        this._cache.delete(namespaceKey);
      }, expireSeconds * 1000));
    }
    return Promise.resolve(true);
  }

  setSync(key: string, value: string, namespace?: string, expireSeconds?: number): boolean {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;
    this._cache.set(key, value);
    if (this._timeoutMap.has(key)) {
      clearTimeout(this._timeoutMap.get(key));
    }
    if (expireSeconds) {
      this._timeoutMap.set(namespaceKey, setTimeout(() => {
        this._cache.delete(namespaceKey);
      }, expireSeconds * 1000));
    }
    return true;
  }
}