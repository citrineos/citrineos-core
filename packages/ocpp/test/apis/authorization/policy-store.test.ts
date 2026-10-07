// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IRoleProvider } from '@citrineos/base';
import type { RoleDefinitions, SystemConfig } from '@citrineos/types';
import { type ILogObj, Logger } from 'tslog';
import { PolicyStore } from '@/apis/authorization/policy/policy-store.js';

const hiddenLogger = new Logger<ILogObj>({ type: 'hidden' });

const aConfig = (refreshIntervalSeconds = 60, mode = 'localBypass') =>
  ({
    auth: { mode },
    roles: { refreshIntervalSeconds, common: [] },
  }) as unknown as SystemConfig;

const aCatalog = () =>
  new Set([
    'ocpp.configuration.triggerMessage',
    'ocpp.configuration.reset',
    'ocpp.reporting.getLog',
    'permissions.user.get',
  ]);

function aProvider(...responses: Array<RoleDefinitions | Error>): IRoleProvider {
  const queue = [...responses];
  return {
    listRoles: vi.fn(async () => {
      const next = queue.length > 1 ? queue.shift()! : queue[0];
      if (next instanceof Error) {
        throw next;
      }
      return next;
    }),
  };
}

const partnerOnly: RoleDefinitions = {
  partner: {
    resources: { Locations: ['list', 'show'] },
    permissions: ['ocpp.configuration.triggerMessage'],
  },
};

afterEach(() => {
  vi.useRealTimers();
});

describe('PolicyStore', () => {
  it('answers from the roles the provider returned', async () => {
    const store = new PolicyStore({
      config: aConfig(),
      roleProvider: aProvider(partnerOnly),
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });
    await store.refresh();

    expect(store.hasPermission(['partner'], 'ocpp.configuration.triggerMessage')).toBe(true);
    expect(store.hasPermission(['partner'], 'ocpp.configuration.reset')).toBe(false);
    expect(store.hasPermission(['nobody'], 'ocpp.configuration.triggerMessage')).toBe(false);
  });

  it('unions grants across a user holding several roles', async () => {
    const store = new PolicyStore({
      config: aConfig(),
      roleProvider: aProvider({
        ...partnerOnly,
        reporter: { resources: { Locations: ['export'] }, permissions: ['ocpp.reporting.getLog'] },
      }),
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });
    await store.refresh();

    expect(store.permissionsFor(['partner', 'reporter'])).toEqual({
      resources: { Locations: ['export', 'list', 'show'] },
      permissions: ['ocpp.configuration.triggerMessage', 'ocpp.reporting.getLog'],
    });
  });

  it('keeps the last good policy when a later refresh fails', async () => {
    const store = new PolicyStore({
      config: aConfig(),
      roleProvider: aProvider(partnerOnly, new Error('provider unreachable')),
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });
    await store.refresh();
    await store.refresh();

    expect(store.hasPermission(['partner'], 'ocpp.configuration.triggerMessage')).toBe(true);
  });

  it('grants nothing when the very first load fails', async () => {
    const store = new PolicyStore({
      config: aConfig(),
      roleProvider: aProvider(new Error('provider unreachable')),
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });
    await store.refresh();

    expect(store.hasPermission(['partner'], 'ocpp.configuration.triggerMessage')).toBe(false);
  });

  it('picks up a changed policy on the refresh interval', async () => {
    vi.useFakeTimers();
    const store = new PolicyStore({
      config: aConfig(1),
      roleProvider: aProvider(partnerOnly, {
        partner: { resources: {}, permissions: ['ocpp.configuration.reset'] },
      }),
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });
    await store.start();

    expect(store.hasPermission(['partner'], 'ocpp.configuration.reset')).toBe(false);

    await vi.advanceTimersByTimeAsync(1000);

    expect(store.hasPermission(['partner'], 'ocpp.configuration.reset')).toBe(true);
    store.shutdown();
  });

  it('stops refreshing once shut down', async () => {
    vi.useFakeTimers();
    const roleProvider = aProvider(partnerOnly);
    const store = new PolicyStore({
      config: aConfig(1),
      roleProvider,
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });
    await store.start();
    store.shutdown();

    await vi.advanceTimersByTimeAsync(5000);

    expect(roleProvider.listRoles).toHaveBeenCalledTimes(1);
  });
});

describe('PolicyStore common baseline', () => {
  const withCommon = (common: string[]) =>
    ({
      auth: { mode: 'localBypass' },
      roles: { refreshIntervalSeconds: 60, common },
    }) as unknown as SystemConfig;

  it('grants the baseline to a role that does not list it', async () => {
    const store = new PolicyStore({
      config: withCommon(['permissions.user.get']),
      roleProvider: aProvider(partnerOnly),
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });
    await store.refresh();

    expect(store.hasPermission(['partner'], 'permissions.user.get')).toBe(true);
    expect(store.permissionsFor(['partner']).permissions).toContain('permissions.user.get');
  });

  it('grants the baseline even to a role the provider has never heard of', async () => {
    const store = new PolicyStore({
      config: withCommon(['permissions.user.get']),
      roleProvider: aProvider(partnerOnly),
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });
    await store.refresh();

    expect(store.hasPermission(['someone-elses-role'], 'permissions.user.get')).toBe(true);
    expect(store.hasPermission(['someone-elses-role'], 'ocpp.configuration.reset')).toBe(false);
  });

  it('grants nothing extra when the baseline is empty', async () => {
    const store = new PolicyStore({
      config: withCommon([]),
      roleProvider: aProvider(partnerOnly),
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });
    await store.refresh();

    expect(store.hasPermission(['partner'], 'permissions.user.get')).toBe(false);
  });
});

describe('PolicyStore startup', () => {
  it('refuses to start when the first load fails and the mode enforces', async () => {
    const store = new PolicyStore({
      config: aConfig(60, 'jwt'),
      roleProvider: aProvider(new Error('provider unreachable')),
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });

    await expect(store.start()).rejects.toThrow('refusing to start while enforcing');
  });

  it('starts despite a failed first load when the mode does not enforce', async () => {
    const store = new PolicyStore({
      config: aConfig(60, 'localBypass'),
      roleProvider: aProvider(new Error('provider unreachable')),
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });

    await expect(store.start()).resolves.toBeUndefined();
    store.shutdown();
  });
});

describe('PolicyStore refresh coalescing', () => {
  it('runs one load when callers overlap', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const roleProvider: IRoleProvider = {
      listRoles: vi.fn(async () => {
        await gate;
        return partnerOnly;
      }),
    };
    const store = new PolicyStore({
      config: aConfig(),
      roleProvider,
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });

    const first = store.refresh();
    const second = store.refresh();
    release?.();
    await Promise.all([first, second]);

    expect(roleProvider.listRoles).toHaveBeenCalledTimes(1);
  });

  it('loads again once the previous load has settled', async () => {
    const roleProvider = aProvider(partnerOnly);
    const store = new PolicyStore({
      config: aConfig(),
      roleProvider,
      permissionCatalog: aCatalog(),
      logger: hiddenLogger,
    });

    await store.refresh();
    await store.refresh();

    expect(roleProvider.listRoles).toHaveBeenCalledTimes(2);
  });
});

describe('PolicyStore unknown permissions', () => {
  const aRecordingLogger = () => {
    const warnings: string[] = [];
    const logger = new Logger<ILogObj>({ type: 'hidden' });
    vi.spyOn(Logger.prototype, 'warn').mockImplementation((...args: unknown[]) => {
      warnings.push(args.map(String).join(' '));
      return undefined;
    });
    return { logger, warnings };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns about seed permissions the build does not expose', async () => {
    const { logger, warnings } = aRecordingLogger();
    const store = new PolicyStore({
      config: aConfig(),
      roleProvider: aProvider({
        partner: { resources: {}, permissions: ['ocpp.configuration.notARealEndpoint'] },
      }),
      permissionCatalog: aCatalog(),
      logger,
    });

    await store.refresh();

    expect(warnings.join(' ')).toContain('partner: ocpp.configuration.notARealEndpoint');
  });

  it('stays quiet when every granted permission is in the catalog', async () => {
    const { logger, warnings } = aRecordingLogger();
    const store = new PolicyStore({
      config: aConfig(),
      roleProvider: aProvider(partnerOnly),
      permissionCatalog: aCatalog(),
      logger,
    });

    await store.refresh();

    expect(warnings).toEqual([]);
  });
});

describe('PolicyStore unknown roles', () => {
  const aRecordingLogger = () => {
    const warnings: string[] = [];
    const logger = new Logger<ILogObj>({ type: 'hidden' });
    vi.spyOn(Logger.prototype, 'warn').mockImplementation((...args: unknown[]) => {
      warnings.push(args.map(String).join(' '));
      return undefined;
    });
    return { logger, warnings };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns once about a role the seed does not define', async () => {
    const { logger, warnings } = aRecordingLogger();
    const store = new PolicyStore({
      config: aConfig(),
      roleProvider: aProvider(partnerOnly),
      permissionCatalog: aCatalog(),
      logger,
    });
    await store.refresh();

    store.hasPermission(['Partner'], 'ocpp.configuration.reset');
    store.hasPermission(['Partner'], 'ocpp.configuration.reset');
    store.permissionsFor(['Partner']);

    expect(warnings.filter((line) => line.includes("role 'Partner'"))).toHaveLength(1);
  });

  it('stays quiet for a role the seed defines', async () => {
    const { logger, warnings } = aRecordingLogger();
    const store = new PolicyStore({
      config: aConfig(),
      roleProvider: aProvider(partnerOnly),
      permissionCatalog: aCatalog(),
      logger,
    });
    await store.refresh();

    store.hasPermission(['partner'], 'ocpp.configuration.triggerMessage');

    expect(warnings).toEqual([]);
  });

  it('warns again after a refresh, so a role removed from the seed resurfaces', async () => {
    const { logger, warnings } = aRecordingLogger();
    const store = new PolicyStore({
      config: aConfig(),
      roleProvider: aProvider(partnerOnly),
      permissionCatalog: aCatalog(),
      logger,
    });
    await store.refresh();

    store.hasPermission(['Partner'], 'ocpp.configuration.reset');
    await store.refresh();
    store.hasPermission(['Partner'], 'ocpp.configuration.reset');

    expect(warnings.filter((line) => line.includes("role 'Partner'"))).toHaveLength(2);
  });
});
