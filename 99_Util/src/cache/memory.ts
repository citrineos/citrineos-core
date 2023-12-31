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
  private _keySubscriptionMap: Map<string, (arg: string | null) => void>;
  private _keySubscriptionPromiseMap: Map<string, Promise<string | null>>;
  private _lockMap: Map<string, Promise<void>>;
  private _timeoutMap: Map<string, NodeJS.Timeout>;

  constructor() {
    const keySubscriptionMap: Map<string, (arg: string | null) => void> = new Map();
    const subscriptionHandler: ProxyHandler<Map<string, string>> = {
      // Returns value on keySubscriptions when Map.set(key, value) is called
      set(target, property, value) {
        const setOutcome = Reflect.set(target, property, value);
        if (typeof property === "string" && keySubscriptionMap.has(property) && setOutcome) {
          keySubscriptionMap.get(property)!(value);
        }
        return setOutcome;
      },
      // Returns null on keySubscriptions when Map.delete(key) is called
      deleteProperty(target, property) {
        const deleteOutcome = Reflect.deleteProperty(target, property);
        if (typeof property === "string" && keySubscriptionMap.has(property) && deleteOutcome) {
          keySubscriptionMap.get(property)!(null);
        }
        return deleteOutcome;
      },
      // Here to support Map.get and Map.has, does not alter behavior
      get(target, property) {
        const value = Reflect.get(target, property);
        if (typeof value === 'function') {
            // Return a bound version of the method to the original target
            return value.bind(target);
        }
        return value;
      }
    };

    this._cache = new Proxy(new Map(), subscriptionHandler);
    this._keySubscriptionMap = keySubscriptionMap;
    this._keySubscriptionPromiseMap = new Map();
    this._lockMap = new Map();
    this._timeoutMap = new Map();

  }

  exists(key: string, namespace?: string): Promise<boolean> {
    namespace = namespace || "default";
    const namespaceKey = `${namespace}:${key}`;
    return Promise.resolve(this._cache.has(namespaceKey));
  }

  async remove(key: string, namespace?: string): Promise<boolean> {
    namespace = namespace || "default";
    const namespaceKey = `${namespace}:${key}`;
    const lock = this._lockMap.get(namespaceKey);
    if (lock) {
      await lock;
    }
    return this._cache.delete(namespaceKey);
  }

  onChange<T>(key: string, waitSeconds: number, namespace?: string, classConstructor?: () => ClassConstructor<T>): Promise<T | null> {
    namespace = namespace || "default";
    const namespaceKey = `${namespace}:${key}`;

    // Either get existing promise awaiting change on this key or create a new one and store it.
    // This way, any number of threads can wait for the same key at the same time.
    // Type must include 'undefined' due to Map.get(key)'s return type, however in no case can it actually be undefined.
    const onChangeValuePromise: Promise<string | null> | undefined = this._keySubscriptionPromiseMap.has(namespaceKey)
      ? this._keySubscriptionPromiseMap.get(namespaceKey)
      : this._keySubscriptionPromiseMap.set(namespaceKey, new Promise<string | null>((resolve) => {
        this._keySubscriptionMap.set(namespaceKey, (value: string | null) => {
          resolve(value);
          this._keySubscriptionMap.delete(namespaceKey);
          this._keySubscriptionPromiseMap.delete(namespaceKey);
        });
      })).get(namespaceKey);

    return Promise.race([
      onChangeValuePromise!.then((value) => {
        if (typeof value === "string") {
          if (classConstructor) {
            return plainToInstance(classConstructor(), JSON.parse(value));
          } else {
            return value as T;
          }
        } else {
          return value;
        }
      }), new Promise<T | null>((resolve) => {
        setTimeout(() => {
          resolve(this.get(key, namespace, classConstructor));
        }, waitSeconds * 1000);
      })]);
  }


  async get<T>(key: string, namespace?: string, classConstructor?: () => ClassConstructor<T>): Promise<T | null> {
    namespace = namespace || "default";
   const namespaceKey = `${namespace}:${key}`;
    const lock = this._lockMap.get(namespaceKey);
    if (lock) {
      await lock;
    }
    const result = this._cache.get(namespaceKey);
    if (result) {
      if (classConstructor) {
        return plainToInstance(classConstructor(), JSON.parse(result));
      }
      return result as T;
    }
    return null;
  }

  getAndRemove<T>(key: string, namespace?: string | undefined, classConstructor?: (() => ClassConstructor<T>) | undefined): Promise<T | null> {
    namespace = namespace || "default";
    const namespaceKey = `${namespace}:${key}`;
    return new Promise<T | null>((resolveGet) => {
      this._lockMap.set(namespaceKey, new Promise<void>((resolveLock) => {
        const result = this._cache.get(namespaceKey);
        if (result) {
          if (classConstructor) {
            resolveGet(plainToInstance(classConstructor(), JSON.parse(result)));
          } else {
            resolveGet(result as T);
          }
        } else {
          resolveGet(null);
        }
        this._cache.delete(namespaceKey);
        resolveLock();
        this._lockMap.delete(namespaceKey);
      }));
    });
  }

  getSync<T>(key: string, namespace?: string, classConstructor?: () => ClassConstructor<T>): T | null {
    namespace = namespace || "default";
    const namespaceKey = `${namespace}:${key}`;
    const lock = this._lockMap.get(namespaceKey);
    if (lock) {
      throw new Error("Cannot call getSync() on a locked key");
    }
    const value = this._cache.get(namespaceKey);
    if (value) {
      if (classConstructor) {
        return plainToInstance(classConstructor(), JSON.parse(value));
      }
      return value as T;
    } else {
      return null;
    }
  }

  async set(key: string, value: string, namespace?: string, expireSeconds?: number): Promise<boolean> {
    namespace = namespace || "default";
    const namespaceKey = `${namespace}:${key}`;
    const lock = this._lockMap.get(namespaceKey);
    if (lock) {
      await lock;
    }
    this._cache.set(namespaceKey, value);
    if (this._timeoutMap.has(namespaceKey)) {
      clearTimeout(this._timeoutMap.get(namespaceKey));
    }
    if (expireSeconds) {
      this._timeoutMap.set(namespaceKey, setTimeout(() => {
        this._cache.delete(namespaceKey);
      }, expireSeconds * 1000));
    }
    return true;
  }

  setSync(key: string, value: string, namespace?: string, expireSeconds?: number): boolean {
    namespace = namespace || "default";
    const namespaceKey = `${namespace}:${key}`;
    const lock = this._lockMap.get(namespaceKey);
    if (lock) {
      throw new Error("Cannot call setSync() on a locked key");
    }
    this._cache.set(namespaceKey, value);
    if (this._timeoutMap.has(namespaceKey)) {
      clearTimeout(this._timeoutMap.get(namespaceKey));
    }
    if (expireSeconds) {
      this._timeoutMap.set(namespaceKey, setTimeout(() => {
        this._cache.delete(namespaceKey);
      }, expireSeconds * 1000));
    }
    return true;
  }
}
