// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { AbstractModule, type ICache } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import { CallbackUrlNotifier } from '@modules/ocpp-router/callback-url-notifier.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CORRELATION_ID = 'msg-123';
const STATION_ID = 'CS001';
const URL = 'https://example.test/callback';

describe('CallbackUrlNotifier', () => {
  const { container, logger } = createTestContainer();
  let cache: { get: ReturnType<typeof vi.fn> };
  let fetchMock: ReturnType<typeof vi.fn>;
  let notifier: CallbackUrlNotifier;

  function buildNotifier(config?: Partial<SystemConfig>): CallbackUrlNotifier {
    return getTestInstance(container, CallbackUrlNotifier, {
      cache: cache as unknown as ICache,
      config: config as SystemConfig,
    });
  }

  function initOf(call = 0): RequestInit {
    return fetchMock.mock.calls[call][1];
  }

  beforeEach(() => {
    cache = { get: vi.fn().mockResolvedValue(URL) };
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(''),
    } as Response);
    vi.stubGlobal('fetch', fetchMock);
    notifier = buildNotifier();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // ─── lookup ────────────────────────────────────────────────────────────────

  describe('callback url lookup', () => {
    it('should look the url up under the callback prefix for the station', async () => {
      await notifier.notify(CORRELATION_ID, STATION_ID, { status: 'Accepted' });

      expect(cache.get).toHaveBeenCalledWith(
        CORRELATION_ID,
        AbstractModule.CALLBACK_URL_CACHE_PREFIX + STATION_ID,
      );
    });

    it('should do nothing when the request carried no callback url', async () => {
      cache.get.mockResolvedValue(null);

      await notifier.notify(CORRELATION_ID, STATION_ID, {});

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // ─── posting ───────────────────────────────────────────────────────────────

  describe('notify', () => {
    it('should POST the payload as JSON to the cached url', async () => {
      const payload = { status: 'Accepted' };

      await notifier.notify(CORRELATION_ID, STATION_ID, payload);

      expect(fetchMock).toHaveBeenCalledWith(URL, expect.anything());
      expect(initOf()).toMatchObject({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(JSON.parse(String(initOf().body))).toEqual(payload);
    });

    it('should not send an Authorization header when no OIDC client is configured', async () => {
      await notifier.notify(CORRELATION_ID, STATION_ID, {});

      expect(initOf().headers).toEqual({ 'Content-Type': 'application/json' });
    });
  });

  // ─── failure containment ───────────────────────────────────────────────────

  describe('failure containment', () => {
    it('should log a non-2xx response without throwing', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('boom'),
      } as Response);

      await expect(notifier.notify(CORRELATION_ID, STATION_ID, {})).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should swallow a transport failure, because a caller endpoint must not break OCPP', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(notifier.notify(CORRELATION_ID, STATION_ID, {})).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
