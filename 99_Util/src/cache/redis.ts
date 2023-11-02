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
import { default as deasyncPromise } from "deasync-promise";
import { RedisClientType, createClient } from "redis";

/**
 * Implementation of cache interface with redis storage
 */
export class RedisCache implements ICache {
  private _client: RedisClientType;

  constructor(client?: RedisClientType) {
    this._client = client ?? createClient();
  }

  exists(key: string, namespace?: string): Promise<boolean> {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;
    return this._client.exists(key).then((result) => result === 1);
  }

  remove(key: string, namespace?: string | undefined): Promise<boolean> {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;
    return this._client.del(key).then((result) => result === 1);
  }

  get<T>(key: string, namespace?: string, classConstructor?: () => ClassConstructor<T>): Promise<T | null> {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;
    return this._client.get(key).then((result) => {
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
    return deasyncPromise(this._client.get(key).then((result) => {
      if (result) {
        if (classConstructor) {
          return plainToInstance(classConstructor(), JSON.parse(result));
        }
        return result as T;
      }
      return null;
    }));
  }

  set(key: string, value: string, namespace?: string, expireSeconds?: number): Promise<boolean> {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;
    return this._client.set(key, value, { EX: expireSeconds }).then((result) => {
      if (result) {
        return result === "OK";
      }
      return false;
    });
  }

  setSync(key: string, value: string, namespace?: string, expireSeconds?: number): boolean {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;
    return deasyncPromise(this._client.set(key, value, { EX: expireSeconds }).then((result) => {
      if (result) {
        return result === "OK";
      }
      return false;
    }));
  }
}
