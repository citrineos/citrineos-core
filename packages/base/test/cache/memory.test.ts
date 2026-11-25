// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { MemoryCache } from '../../src/cache/memory.js';

describe('MemoryCache', () => {
  it('preserves empty string values on get and remove instead of returning null', async () => {
    const cache = new MemoryCache();
    await cache.set('empty-key', '', 'ns');

    await expect(cache.get<string>('empty-key', 'ns')).resolves.toBe('');
    await expect(cache.remove<string>('empty-key', 'ns')).resolves.toBe('');
    await expect(cache.get<string>('empty-key', 'ns')).resolves.toBeNull();
  });
});
