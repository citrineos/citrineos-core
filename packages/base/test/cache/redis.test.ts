// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();

const mockRedisClient = {
  on: vi.fn(),
  connect: vi.fn(async () => undefined),
  get: vi.fn(async (key: string) => (store.has(key) ? (store.get(key) ?? null) : null)),
  getDel: vi.fn(async (key: string) => {
    if (!store.has(key)) {
      return null;
    }
    const val = store.get(key) ?? null;
    store.delete(key);
    return val;
  }),
  set: vi.fn(async (key: string, value: string) => {
    store.set(key, value);
    return 'OK';
  }),
};

vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedisClient),
}));

import { RedisCache } from '../../src/cache/redis.js';

describe('RedisCache', () => {
  it('preserves empty string values on get and remove instead of returning null', async () => {
    store.clear();
    const cache = new RedisCache();
    await cache.set('empty-key', '', 'ns');

    await expect(cache.get<string>('empty-key', 'ns')).resolves.toBe('');
    await expect(cache.remove<string>('empty-key', 'ns')).resolves.toBe('');
    await expect(cache.get<string>('empty-key', 'ns')).resolves.toBeNull();
  });
});
