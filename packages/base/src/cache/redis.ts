// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CacheExpiry, ICache } from '../interfaces/cache/cache.js';
import { childLogger } from '../util/logging.js';
import type { ClassConstructor } from 'class-transformer';
import { plainToInstance } from 'class-transformer';
import type {
  RedisClientOptions,
  RedisClientType,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from 'redis';
import { createClient } from 'redis';
import type { ILogObj, Logger } from 'tslog';

const EXPIRED_CHANNEL = '__keyevent@0__:expired';
const KEY_GONE_CHANNELS = [EXPIRED_CHANNEL, '__keyevent@0__:del', '__keyevent@0__:evicted'];

interface ExpiryCallbackEntry {
  key: string;
  namespace: string;
  onExpire: (key: string, namespace: string) => void | Promise<void>;
}

/**
 * Implementation of cache interface with redis storage
 */
export class RedisCache implements ICache {
  private _client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
  private _logger: Logger<ILogObj>;
  private _expiryCallbacks = new Map<string, ExpiryCallbackEntry>();
  private _expirySubscription?: Promise<void>;

  constructor(clientOptions?: RedisClientOptions, logger?: Logger<ILogObj>) {
    this._logger = childLogger(logger, this.constructor.name);
    this._client = clientOptions ? createClient(clientOptions) : createClient();
    this._client.on('connect', () => this._logger.info('Redis client connected'));
    this._client.on('ready', () => this._logger.info('Redis client ready to use'));
    this._client.on('error', (err) => this._logger.error('Redis error', err));
    this._client.on('end', () => this._logger.info('Redis client disconnected'));
    this._client.connect().catch((error) => {
      this._logger.error('Error connecting to Redis', error);
    });
  }

  exists(key: string, namespace?: string): Promise<boolean> {
    namespace = namespace || 'default';
    key = `${namespace}:${key}`;
    return this._client.exists(key).then((result) => result === 1);
  }

  async existsAnyInNamespace(namespace: string): Promise<boolean> {
    const keys = await this._client.keys(`${namespace}:*`);
    return keys.length > 0;
  }

  remove<T>(
    key: string,
    namespace?: string | undefined,
    classConstructor?: () => ClassConstructor<T>,
  ): Promise<T | null> {
    namespace = namespace || 'default';
    key = `${namespace}:${key}`;
    this._expiryCallbacks.delete(key);
    return this._client.getDel(key).then((result) => {
      if (result) {
        if (classConstructor) {
          return plainToInstance(classConstructor(), JSON.parse(result));
        }
        return result as T;
      }
      return null;
    });
  }

  onChange<T>(
    key: string,
    waitSeconds: number,
    namespace?: string | undefined,
    classConstructor?: (() => ClassConstructor<T>) | undefined,
  ): Promise<T | null> {
    namespace = namespace || 'default';
    const namespacedKey = `${namespace}:${key}`;

    return new Promise((resolve) => {
      // Create a Redis subscriber to listen for operations affecting the key
      const subscriber = this._client.duplicate();
      subscriber.on('error', (err) => this._logger.error('Redis subscriber error', err));
      subscriber.connect().catch((error) => {
        this._logger.error('Error connecting Redis subscriber', error);
      });
      // Channel: Key-space, message: the name of the event, which is the command executed on the key
      subscriber
        .subscribe(`__keyspace@0__:${namespacedKey}`, (message) => {
          switch (message) {
            case 'set':
              resolve(this.get(key, namespace, classConstructor));
              subscriber
                .quit()
                .then()
                .catch((error) => {
                  // Ignore error if client is already closed
                  if (!error.message?.includes('The client is closed')) {
                    this._logger.error('Error quitting subscriber', error);
                  }
                });
              break;
            case 'del':
            case 'expire':
              resolve(null);
              subscriber
                .quit()
                .then()
                .catch((error) => {
                  // Ignore error if client is already closed
                  if (!error.message?.includes('The client is closed')) {
                    this._logger.error('Error quitting subscriber', error);
                  }
                });
              break;
            default:
              // Do nothing
              break;
          }
        })
        .then()
        .catch((error) => {
          this._logger.error('Error creating Redis subscriber', error);
        });
      setTimeout(() => {
        resolve(this.get(key, namespace, classConstructor));
        subscriber
          .quit()
          .then()
          .catch((error) => {
            // Ignore error if client is already closed
            if (!error.message?.includes('The client is closed')) {
              console.log('Error quitting subscriber', error);
            }
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

  async set(
    key: string,
    value: string,
    namespace?: string,
    expire?: CacheExpiry,
  ): Promise<boolean> {
    namespace = namespace || 'default';
    const expireSeconds = typeof expire === 'object' ? expire.seconds : expire;
    const setOptions = expireSeconds ? { EX: expireSeconds } : undefined;
    return this._setWithExpiryCallback(key, namespace, expire, () =>
      this._client.set(`${namespace}:${key}`, value, setOptions),
    );
  }

  async setIfNotExist(
    key: string,
    value: string,
    namespace?: string,
    expire?: CacheExpiry,
  ): Promise<boolean> {
    namespace = namespace || 'default';
    const expireSeconds = typeof expire === 'object' ? expire.seconds : expire;
    return this._setWithExpiryCallback(key, namespace, expire, () =>
      this._client.set(
        `${namespace}:${key}`,
        value,
        expireSeconds ? { EX: expireSeconds, NX: true } : { NX: true },
      ),
    );
  }

  updateExpiration(key: string, expireSeconds: number, namespace?: string): Promise<boolean> {
    namespace = namespace || 'default';
    key = `${namespace}:${key}`;
    return this._client.expire(key, expireSeconds);
  }

  async ping(): Promise<void> {
    await this._client.ping();
  }

  /**
   * The callback is registered, and the subscription that reports the key's expiry is in place,
   * before the key is written: a key removed straight after the write must still be seen to go.
   */
  private async _setWithExpiryCallback(
    key: string,
    namespace: string,
    expire: CacheExpiry | undefined,
    write: () => Promise<string | null>,
  ): Promise<boolean> {
    const onExpire = typeof expire === 'object' ? expire.onExpire : undefined;
    if (!onExpire) {
      return (await write()) === 'OK';
    }
    await this._subscribeToKeyEvents();
    const namespacedKey = `${namespace}:${key}`;
    const previous = this._expiryCallbacks.get(namespacedKey);
    const entry: ExpiryCallbackEntry = { key, namespace, onExpire };
    this._expiryCallbacks.set(namespacedKey, entry);
    let written = false;
    try {
      written = (await write()) === 'OK';
      return written;
    } finally {
      if (!written && this._expiryCallbacks.get(namespacedKey) === entry) {
        if (previous) {
          this._expiryCallbacks.set(namespacedKey, previous);
        } else {
          this._expiryCallbacks.delete(namespacedKey);
        }
      }
    }
  }

  private _subscribeToKeyEvents(): Promise<void> {
    this._expirySubscription ??= this._createKeyEventSubscriber().catch((error) => {
      this._expirySubscription = undefined;
      throw error;
    });
    return this._expirySubscription;
  }

  /**
   * Keyevent notifications go to every subscriber, so each instance hears about every key that
   * expires, is deleted or is evicted, and ignores the ones it holds no callback for.
   */
  private async _createKeyEventSubscriber(): Promise<void> {
    const subscriber = this._client.duplicate();
    subscriber.on('error', (err) => this._logger.error('Redis key event subscriber error', err));
    let connectedBefore = false;
    subscriber.on('ready', () => {
      // Notifications sent while the subscriber was away are lost, including the deletions that
      // would have dropped callbacks for keys that are now gone.
      if (connectedBefore) {
        this._dropCallbacksForMissingKeys().catch((error) => {
          this._logger.error('Failed to drop expiry callbacks after reconnecting', error);
        });
      }
      connectedBefore = true;
    });
    try {
      await subscriber.connect();
      await subscriber.subscribe(KEY_GONE_CHANNELS, (namespacedKey, channel) =>
        this._onKeyGone(namespacedKey, channel),
      );
    } catch (error) {
      await subscriber.disconnect().catch(() => undefined);
      throw error;
    }
  }

  private _onKeyGone(namespacedKey: string, channel: string): void {
    const entry = this._expiryCallbacks.get(namespacedKey);
    if (!entry) {
      return;
    }
    // The notification can arrive after the key has been written again.
    this._client
      .exists(namespacedKey)
      .then((exists) => {
        if (exists || this._expiryCallbacks.get(namespacedKey) !== entry) {
          return;
        }
        this._expiryCallbacks.delete(namespacedKey);
        if (channel === EXPIRED_CHANNEL) {
          return entry.onExpire(entry.key, entry.namespace);
        }
      })
      .catch((error) => {
        this._logger.error('Expiry callback failed', namespacedKey, error);
      });
  }

  private async _dropCallbacksForMissingKeys(): Promise<void> {
    await Promise.all(
      [...this._expiryCallbacks].map(async ([namespacedKey, entry]) => {
        if (
          !(await this._client.exists(namespacedKey)) &&
          this._expiryCallbacks.get(namespacedKey) === entry
        ) {
          this._expiryCallbacks.delete(namespacedKey);
        }
      }),
    );
  }
}
