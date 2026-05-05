// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

/**
 * Redis-backed `CacheService` swap. Drop-in replacement for the in-memory
 * variant — same surface (`get`/`set`/`remove`/`onChange`).
 *
 * Selected by `CacheModule` when `config.util.cache.redis` is set. Defaults
 * to in-memory otherwise so single-process deployments don't need Redis.
 *
 * `onChange` is implemented via Redis pub/sub: a publisher connection signals
 * a per-station/key channel each time a key is set or removed, and a
 * subscriber connection awaits the next event.
 *
 * Implementation note: `redis` is loaded lazily so single-process deployments
 * never have to install it. If the dependency is missing this throws a clear
 * error at startup.
 */
@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client?: {
    get: Function;
    set: Function;
    del: Function;
    publish: Function;
    quit: Function;
  };
  private subscriber?: { subscribe: Function; unsubscribe: Function; quit: Function };

  constructor(private readonly url: string) {}

  async onModuleInit(): Promise<void> {
    let redisModule: { createClient: Function };
    try {
      // Lazy require so single-process deployments don't need the dep installed.
      redisModule = await import('redis');
    } catch (err) {
      throw new Error(
        `RedisCacheService selected but the 'redis' package is not installed. ` +
          `Run \`npm install redis\` in nestjs/, or set util.cache.memory=true. (${(err as Error).message})`,
      );
    }
    this.client = await redisModule.createClient({ url: this.url });
    this.subscriber = await redisModule.createClient({ url: this.url });
    await Promise.all([(this.client as any).connect(), (this.subscriber as any).connect()]);
    this.logger.log(`Redis cache connected: ${this.url}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => {});
    await this.subscriber?.quit().catch(() => {});
  }

  private compositeKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  async get<T = string>(key: string, namespace?: string): Promise<T | null> {
    if (!this.client) return null;
    const v = await this.client.get(this.compositeKey(key, namespace));
    return (v ?? null) as T | null;
  }

  async set(key: string, value: string, namespace?: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    const ck = this.compositeKey(key, namespace);
    if (ttlSeconds) {
      await this.client.set(ck, value, { EX: ttlSeconds });
    } else {
      await this.client.set(ck, value);
    }
    await this.client.publish(`change:${ck}`, value);
  }

  async remove(key: string, namespace?: string): Promise<void> {
    if (!this.client) return;
    const ck = this.compositeKey(key, namespace);
    await this.client.del(ck);
    await this.client.publish(`change:${ck}`, '');
  }

  async onChange(key: string, timeoutSeconds: number, namespace?: string): Promise<string | null> {
    if (!this.subscriber) return null;
    const ck = this.compositeKey(key, namespace);
    const channel = `change:${ck}`;
    return new Promise((resolve) => {
      let settled = false;
      const settle = (value: string | null): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.subscriber!.unsubscribe(channel).catch(() => {});
        resolve(value);
      };
      const timer = setTimeout(() => settle(null), timeoutSeconds * 1000);
      this.subscriber!.subscribe(channel, (message: string) => settle(message || null));
    });
  }
}
