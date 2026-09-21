// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { TenantPartnerDto } from '@citrineos/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';
import {
  COMMAND_RESPONSE_URL_CACHE_NAMESPACE,
  COMMAND_RESPONSE_URL_CACHE_RESOLVED,
} from '../../src/util/consts.js';
import { CommandsClientApi } from '../../src/transport/trigger/commands-client-api.js';

const COMMAND_ID = 'cmd-1';
const COMMAND_TIMEOUT_SECONDS = 30;

function aCacheThatOnlyReadsWhenTheWaitElapses() {
  const entries = new Map<string, { value: string; expiresAt?: number }>();
  const get = async (key: string, namespace: string) => {
    const entry = entries.get(`${namespace}:${key}`);
    if (!entry || (entry.expiresAt !== undefined && entry.expiresAt <= Date.now())) {
      return null;
    }
    return entry.value;
  };
  return {
    get,
    set: async (key: string, value: string, namespace: string, expireSeconds?: number) => {
      entries.set(`${namespace}:${key}`, {
        value,
        expiresAt: expireSeconds ? Date.now() + expireSeconds * 1000 : undefined,
      });
      return true;
    },
    onChange: (key: string, waitSeconds: number, namespace: string) =>
      new Promise<string | null>((resolve) => {
        setTimeout(() => resolve(get(key, namespace)), waitSeconds * 1000);
      }),
  };
}

function aClient(cache: ReturnType<typeof aCacheThatOnlyReadsWhenTheWaitElapses>) {
  const client = new CommandsClientApi({
    logger: new Logger({ type: 'hidden' }),
    ocpiGraphqlClient: {},
    cacheWrapper: { cache },
    config: { commands: { timeout: COMMAND_TIMEOUT_SECONDS } },
  } as never);
  vi.spyOn(client, 'request').mockResolvedValue({ status_code: 1000, timestamp: new Date() });
  return client;
}

function aPartner(): TenantPartnerDto {
  return {
    countryCode: 'NL',
    partyId: 'MSP',
    tenant: { countryCode: 'GB', partyId: 'CPO' },
    partnerProfileOCPI: {},
  } as unknown as TenantPartnerDto;
}

describe('CommandsClientApi.postCommandResult', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the RESOLVED marker until a wait started when the command was sent has elapsed', async () => {
    const cache = aCacheThatOnlyReadsWhenTheWaitElapses();
    const client = aClient(cache);
    const wait = cache.onChange(
      COMMAND_ID,
      COMMAND_TIMEOUT_SECONDS,
      COMMAND_RESPONSE_URL_CACHE_NAMESPACE,
    );

    await vi.advanceTimersByTimeAsync(2_000);
    await client.postCommandResult(
      aPartner(),
      'https://msp.test/ocpi/commands/START_SESSION/1',
      { result: 'ACCEPTED' } as never,
      COMMAND_ID,
    );
    await vi.advanceTimersByTimeAsync((COMMAND_TIMEOUT_SECONDS - 2) * 1000);

    await expect(wait).resolves.toBe(COMMAND_RESPONSE_URL_CACHE_RESOLVED);
  });
});
