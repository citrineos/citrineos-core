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
    // Set the notify-keyspace-events config for generic keyspace events such as set, expired, and del
    this._client.configSet("notify-keyspace-events", "Kg");
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

  onChange<T>(key: string, waitSeconds: number, namespace?: string | undefined, classConstructor?: (() => ClassConstructor<T>) | undefined): Promise<T | null> {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;

    // Create a Redis subscriber to listen for operations affecting the key
    const subscriber = createClient();
    const onChangeValuePromise: Promise<T | null> = new Promise((resolve) => {
      // Channel: Key-space, message: the name of the event, which is the command executed on the key
      subscriber.subscribe(`__keyspace@0__:${key}`, (channel, message) => {
        switch (message) {
          case "set":
            resolve(this.get(key, namespace, classConstructor));
            subscriber.quit();
            break;
          case "del":
          case "expire":
            resolve(null);
            subscriber.quit();
            break;
          default:
            // Do nothing
            break;
        }
      });
    })

    return Promise.race([onChangeValuePromise, new Promise<T | null>((resolve) => {
      setTimeout(() => {
        resolve(this.get(key, namespace, classConstructor));
        subscriber.quit();
      }, waitSeconds * 1000);
    })]);
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

  getAndRemove<T>(key: string, namespace?: string | undefined, classConstructor?: (() => ClassConstructor<T>) | undefined): Promise<T | null> {
    namespace = namespace || "default";
    key = `${namespace}:${key}`;
    const transaction = this._client.multi();
    transaction.get(key);
    transaction.del(key);
    return new Promise((resolve) => {
      transaction.exec().then((replies) => {
        if (replies[0]) {
          if (classConstructor) {
            resolve(plainToInstance(classConstructor(), JSON.parse(replies[0] as string)));
          } else {
            resolve(replies[0] as T);
          }
        } else {
          resolve(null);
        }
      });
    });
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
