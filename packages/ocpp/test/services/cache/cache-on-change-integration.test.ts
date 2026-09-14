// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from 'node:crypto';
import type { ICache } from '@citrineos/base';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { type ILogObj, Logger } from 'tslog';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MemoryCache } from '@/services/cache/memory.js';
import { RedisCache } from '@/services/cache/redis.js';

const NAMESPACE = 'CS01';
const SUBSCRIBE_GRACE_MS = 500;
const STILL_WAITING = 'still waiting';

let container: StartedTestContainer;
let redisUrl: string;

beforeAll(async () => {
  container = await new GenericContainer('redis:7-alpine')
    .withCommand(['redis-server', '--notify-keyspace-events', 'Kg$'])
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
    .start();
  redisUrl = `redis://${container.getHost()}:${container.getMappedPort(6379)}`;
}, 90_000);

afterAll(async () => {
  await container?.stop();
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe.each([
  { name: 'MemoryCache', aCache: (): ICache => new MemoryCache() },
  {
    name: 'RedisCache',
    aCache: (): ICache =>
      new RedisCache({ url: redisUrl }, new Logger<ILogObj>({ type: 'hidden' })),
  },
])('onChange on $name', ({ aCache }) => {
  it('resolves with the value in the cache when the wait elapses', async () => {
    const cache = aCache();
    const key = randomUUID();
    await cache.set(key, 'response', NAMESPACE);

    const value = await cache.onChange(key, 1, NAMESPACE);

    expect(value).toBe('response');
  });

  it('resolves with the new value as soon as the key is set', async () => {
    const cache = aCache();
    const key = randomUUID();
    const change = cache.onChange(key, 5, NAMESPACE);
    await delay(SUBSCRIBE_GRACE_MS);

    await cache.set(key, 'response', NAMESPACE);

    expect(await Promise.race([change, delay(2000).then(() => STILL_WAITING)])).toBe('response');
  });
});
