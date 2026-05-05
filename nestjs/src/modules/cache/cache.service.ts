// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';

/**
 * In-memory replacement for legacy `@citrineos/base` `ICache`. Used by handlers
 * that need short-lived per-station state (BOOT_STATUS, action blacklists,
 * pending Call/CallResult correlation).
 *
 * Keys are namespaced as `${namespace}:${key}` (matching the legacy contract).
 * Values are stored with optional TTL — entries expire lazily on read.
 *
 * A Redis-backed implementation can ship later behind the same surface; for now
 * memory-only is sufficient because we run a single router instance and the
 * legacy cache config defaulted to memory anyway.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, { value: string; expiresAt: number | null }>();
  private readonly subscribers = new Map<string, Array<(value: string | null) => void>>();

  private compositeKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  async get<T = string>(key: string, namespace?: string): Promise<T | null> {
    const ck = this.compositeKey(key, namespace);
    const entry = this.store.get(ck);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.store.delete(ck);
      return null;
    }
    return entry.value as unknown as T;
  }

  async set(key: string, value: string, namespace?: string, ttlSeconds?: number): Promise<void> {
    const ck = this.compositeKey(key, namespace);
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(ck, { value, expiresAt });
    this.notify(ck, value);
  }

  async remove(key: string, namespace?: string): Promise<void> {
    const ck = this.compositeKey(key, namespace);
    this.store.delete(ck);
    this.notify(ck, null);
  }

  /**
   * Resolves the next time the key changes value, or after `timeoutSeconds`
   * elapses (resolves null on timeout). Mirrors legacy `ICache.onChange`.
   */
  async onChange(key: string, timeoutSeconds: number, namespace?: string): Promise<string | null> {
    const ck = this.compositeKey(key, namespace);
    return new Promise((resolve) => {
      const listeners = this.subscribers.get(ck) ?? [];
      let settled = false;
      const settle = (value: string | null): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const idx = listeners.indexOf(settle);
        if (idx >= 0) listeners.splice(idx, 1);
        resolve(value);
      };
      const timer = setTimeout(() => settle(null), timeoutSeconds * 1000);
      listeners.push(settle);
      this.subscribers.set(ck, listeners);
    });
  }

  private notify(ck: string, value: string | null): void {
    const listeners = this.subscribers.get(ck);
    if (!listeners?.length) return;
    // Snapshot + clear so re-entrant calls don't loop.
    const snapshot = [...listeners];
    listeners.length = 0;
    for (const l of snapshot) l(value);
  }
}
