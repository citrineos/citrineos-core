// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from 'node:crypto';
import type { ICache } from '@citrineos/base';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { type ILogObj, Logger } from 'tslog';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MemoryCache, RedisCache } from '@citrineos/base';

const NAMESPACE = 'CS01';
// Redis reports an expiry when it deletes the key, which can trail the TTL slightly.
const PAST_EXPIRY_MS = 2500;

let container: StartedTestContainer;
let redisUrl: string;

beforeAll(async () => {
  container = await new GenericContainer('redis:7-alpine')
    .withCommand(['redis-server', '--notify-keyspace-events', 'KEg$xe'])
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
    .start();
  redisUrl = `redis://${container.getHost()}:${container.getMappedPort(6379)}`;
}, 90_000);

afterAll(async () => {
  await container?.stop();
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const hiddenLogger = () => new Logger<ILogObj>({ type: 'hidden' });

describe.each([
  {
    name: 'MemoryCache',
    // Instances of a MemoryCache share nothing, so a second instance is the same one.
    aCachePair: (): [ICache, ICache] => {
      const cache = new MemoryCache(hiddenLogger());
      return [cache, cache];
    },
  },
  {
    name: 'RedisCache',
    aCachePair: (): [ICache, ICache] => [
      new RedisCache({ url: redisUrl }, hiddenLogger()),
      new RedisCache({ url: redisUrl }, hiddenLogger()),
    ],
  },
])('expiry callbacks on $name', ({ aCachePair }) => {
  it('calls back with the key and namespace once the key expires', async () => {
    const [cache] = aCachePair();
    const key = randomUUID();
    const onExpire = vi.fn();

    await cache.set(key, 'value', NAMESPACE, { seconds: 1, onExpire });
    await delay(PAST_EXPIRY_MS);

    expect(onExpire).toHaveBeenCalledExactlyOnceWith(key, NAMESPACE);
  });

  it('does not call back for a key removed before it expires', async () => {
    const [cache] = aCachePair();
    const key = randomUUID();
    const onExpire = vi.fn();

    await cache.set(key, 'value', NAMESPACE, { seconds: 1, onExpire });
    await cache.remove(key, NAMESPACE);
    await delay(PAST_EXPIRY_MS);

    expect(onExpire).not.toHaveBeenCalled();
  });

  it('does not call back for a key another instance removed', async () => {
    const [cache, otherInstance] = aCachePair();
    const key = randomUUID();
    const onExpire = vi.fn();

    await cache.set(key, 'value', NAMESPACE, { seconds: 1, onExpire });
    await otherInstance.remove(key, NAMESPACE);
    await delay(PAST_EXPIRY_MS);

    expect(onExpire).not.toHaveBeenCalled();
  });

  it('keeps the callback when the key is written again without one', async () => {
    const [cache] = aCachePair();
    const key = randomUUID();
    const onExpire = vi.fn();

    await cache.set(key, 'first', NAMESPACE, { seconds: 1, onExpire });
    await cache.set(key, 'second', NAMESPACE, 1);
    await delay(PAST_EXPIRY_MS);

    expect(onExpire).toHaveBeenCalledExactlyOnceWith(key, NAMESPACE);
  });

  it('registers the callback only when setIfNotExist writes the key', async () => {
    const [cache] = aCachePair();
    const key = randomUUID();
    const onExpire = vi.fn();
    await cache.set(key, 'existing', NAMESPACE);

    const written = await cache.setIfNotExist(key, 'value', NAMESPACE, { seconds: 1, onExpire });
    await cache.remove(key, NAMESPACE);
    await cache.set(key, 'unrelated', NAMESPACE, 1);
    await delay(PAST_EXPIRY_MS);

    expect(written).toBe(false);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('calls back once setIfNotExist writes the key and it expires', async () => {
    const [cache] = aCachePair();
    const key = randomUUID();
    const onExpire = vi.fn();

    const written = await cache.setIfNotExist(key, 'value', NAMESPACE, { seconds: 1, onExpire });
    await delay(PAST_EXPIRY_MS);

    expect(written).toBe(true);
    expect(onExpire).toHaveBeenCalledExactlyOnceWith(key, NAMESPACE);
  });

  it('carries on calling back after a callback fails', async () => {
    const [cache] = aCachePair();
    const failing = randomUUID();
    const healthy = randomUUID();
    const onExpire = vi.fn();

    await cache.set(failing, 'value', NAMESPACE, {
      seconds: 1,
      onExpire: () => Promise.reject(new Error('boom')),
    });
    await cache.set(healthy, 'value', NAMESPACE, { seconds: 1, onExpire });
    await delay(PAST_EXPIRY_MS);

    expect(onExpire).toHaveBeenCalledExactlyOnceWith(healthy, NAMESPACE);
  });
});
