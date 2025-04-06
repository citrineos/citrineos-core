// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ICache } from '@citrineos/base';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import {
  createClient,
  RedisClientOptions,
  RedisClientType,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from 'redis';

/**
 * Implementation of cache interface with redis storage
 */
export class RedisCache implements ICache {
  private _client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

  constructor(clientOptions?: RedisClientOptions) {
    this._client = clientOptions ? createClient(clientOptions) : createClient();
    this._client.on('connect', () => console.log('Redis client connected'));
    this._client.on('ready', () => console.log('Redis client ready to use'));
    this._client.on('error', (err) => console.error('Redis error', err));
    this._client.on('end', () => console.log('Redis client disconnected'));
    this._client
      .connect()
      .then()
      .catch((error) => {
        console.log('Error connecting to Redis', error);
      });
  }

  exists(key: string, namespace?: string): Promise<boolean> {
    namespace = namespace || 'default';
    key = `${namespace}:${key}`;
    return this._client.exists(key).then((result) => result === 1);
  }

  remove(key: string, namespace?: string | undefined): Promise<boolean> {
    namespace = namespace || 'default';
    key = `${namespace}:${key}`;
    return this._client.del(key).then((result) => result === 1);
  }

  onChange<T>(
    key: string,
    waitSeconds: number,
    namespace?: string | undefined,
    classConstructor?: (() => ClassConstructor<T>) | undefined,
  ): Promise<T | null> {
    namespace = namespace || 'default';
    key = `${namespace}:${key}`;

    return new Promise((resolve) => {
      // Create a Redis subscriber to listen for operations affecting the key
      const subscriber = createClient();
      // Channel: Key-space, message: the name of the event, which is the command executed on the key
      subscriber
        .subscribe(`__keyspace@0__:${key}`, (channel, message) => {
          switch (message) {
            case 'set':
              resolve(this.get(key, namespace, classConstructor));
              subscriber
                .quit()
                .then()
                .catch((error) => {
                  console.log('Error quitting subscriber', error);
                });
              break;
            case 'del':
            case 'expire':
              resolve(null);
              subscriber
                .quit()
                .then()
                .catch((error) => {
                  console.log('Error quitting subscriber', error);
                });
              break;
            default:
              // Do nothing
              break;
          }
        })
        .then()
        .catch((error) => {
          console.log('Error creating Redis subscriber', error);
        });
      setTimeout(() => {
        resolve(this.get(key, namespace, classConstructor));
        subscriber
          .quit()
          .then()
          .catch((error) => {
            console.log('Error closing Redis subscriber', error);
          });
      }, waitSeconds * 1000);
    });
  }

  get<T>(
    key: string,
    namespace?: string,
    classConstructor?: () => ClassConstructor<T>,
  ): Promise<T | null> {
    namespace = namespace || 'default';
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

  set(key: string, value: string, namespace?: string, expireSeconds?: number): Promise<boolean> {
    namespace = namespace || 'default';
    key = `${namespace}:${key}`;
    const setOptions = expireSeconds ? { EX: expireSeconds } : undefined;
    return this._client.set(key, value, setOptions).then((result) => {
      if (result) {
        return result === 'OK';
      }
      return false;
    });
  }

  setIfNotExist(
    key: string,
    value: string,
    namespace?: string,
    expireSeconds?: number,
  ): Promise<boolean> {
    namespace = namespace || 'default';
    key = `${namespace}:${key}`;
    return this._client
      .set(key, value, expireSeconds ? { EX: expireSeconds, NX: true } : { NX: true })
      .then((result) => {
        if (result) {
          return result === 'OK';
        }
        return false;
      });
  }
}
