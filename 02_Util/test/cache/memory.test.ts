// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryCache } from '../../src/cache/memory.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should notify onChange waiters when remove() deletes a key', async () => {
    await cache.setIfNotExist('station-1', 'ReportChargingProfiles:msg-1', 'transactions', 30);

    const changePromise = cache.onChange('station-1', 30, 'transactions');
    await cache.remove('station-1', 'transactions');

    await expect(changePromise).resolves.toBeNull();
  });

  it('should notify onChange waiters when a key expires', async () => {
    await cache.setIfNotExist('station-1', 'ReportChargingProfiles:msg-1', 'transactions', 1);

    const changePromise = cache.onChange('station-1', 30, 'transactions');
    await vi.advanceTimersByTimeAsync(1000);

    await expect(changePromise).resolves.toBeNull();
  });
});
