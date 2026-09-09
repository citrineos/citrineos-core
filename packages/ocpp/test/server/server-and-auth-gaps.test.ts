// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { FastifyRequest } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICache } from '@citrineos/base';
import type { Sequelize } from '@citrineos/dal';
import type { RabbitMQConnectionManager, WebsocketNetworkConnection } from '@/transport/index.js';
import type { SchemaFinding, SchemaValidationReport } from '@/util/index.js';
import { HealthCheckService } from '@/server/health-check-service.js';
import { LocalBypassAuthProvider } from '@/apis/authorization/provider/local-by-pass-auth-provider.js';
import { OidcTokenProvider } from '@/apis/authorization/oidc-token-provider.js';
import { RbacRulesLoader } from '@/apis/authorization/rbac/rbac-rules-loader.js';
import { UrlMatcher } from '@/apis/authorization/rbac/url-matcher.js';

const hiddenLogger = new Logger<ILogObj>({ type: 'hidden' });

const tempDirs: string[] = [];

function tempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('HealthCheckService', () => {
  function aCache(ping = vi.fn().mockResolvedValue(undefined)) {
    return { cache: { ping } as unknown as ICache, ping };
  }

  function aSequelize(pool: unknown = { size: 1, waiting: 0 }): Sequelize {
    return { connectionManager: { pool } } as unknown as Sequelize;
  }

  function aNetworkConnection(servers: Record<string, boolean>): WebsocketNetworkConnection {
    const map = new Map(Object.entries(servers).map(([id, listening]) => [id, { listening }]));
    return { getHttpServers: () => map } as unknown as WebsocketNetworkConnection;
  }

  function aFinding(message: string, severity: SchemaFinding['severity'] = 'error'): SchemaFinding {
    return { kind: 'missing-column', severity, table: 'transactions', message };
  }

  function aSchemaReport(
    errors: SchemaFinding[] = [],
    warnings: SchemaFinding[] = [],
  ): SchemaValidationReport {
    return {
      findings: [...errors, ...warnings],
      errors,
      warnings,
      tablesChecked: 1,
      columnsChecked: 1,
    };
  }

  function aConnectionManager(isConnected: () => boolean) {
    const spy = vi.fn(isConnected);
    return {
      manager: { isConnected: spy } as unknown as RabbitMQConnectionManager,
      isConnected: spy,
    };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports pass when every dependency is healthy', async () => {
    const { cache, ping } = aCache();
    const { manager } = aConnectionManager(() => true);
    const service = new HealthCheckService(
      aNetworkConnection({ main: true }),
      manager,
      cache,
      aSequelize(),
      60,
      hiddenLogger,
    );

    const result = await service.checkReadiness();

    expect(result.status).toBe('pass');
    expect(result.checks).toEqual({
      'websocket:main': { status: 'pass' },
      rabbitmq: { status: 'pass' },
      cache: { status: 'pass' },
      database: { status: 'pass' },
    });
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('fails readiness when rabbitmq is disconnected', async () => {
    const { cache } = aCache();
    const { manager, isConnected } = aConnectionManager(() => false);
    const service = new HealthCheckService(null, manager, cache, aSequelize(), 60, hiddenLogger);

    const result = await service.checkReadiness();

    expect(result.status).toBe('fail');
    expect(result.checks['rabbitmq']).toEqual({ status: 'fail', error: 'not connected' });
    expect(isConnected).toHaveBeenCalledTimes(1);
  });

  it('fails readiness when one websocket server stops listening', async () => {
    const { cache } = aCache();
    const service = new HealthCheckService(
      aNetworkConnection({ a: true, b: false }),
      null,
      cache,
      aSequelize(),
      60,
      hiddenLogger,
    );

    const result = await service.checkReadiness();

    expect(result.status).toBe('fail');
    expect(result.checks['websocket:a']).toEqual({ status: 'pass' });
    expect(result.checks['websocket:b']).toEqual({
      status: 'fail',
      error: 'server not listening',
    });
  });

  it('fails readiness when the cache ping rejects', async () => {
    const { cache, ping } = aCache(vi.fn().mockRejectedValue(new Error('redis down')));
    const service = new HealthCheckService(null, null, cache, aSequelize(), 60, hiddenLogger);

    const result = await service.checkReadiness();

    expect(result.status).toBe('fail');
    expect(result.checks['cache']).toEqual({ status: 'fail', error: 'cache unavailable' });
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('fails readiness when the sequelize pool is missing', async () => {
    const { cache } = aCache();
    // null instead of undefined: undefined would trigger the helper's default healthy pool
    const service = new HealthCheckService(null, null, cache, aSequelize(null), 60, hiddenLogger);

    const result = await service.checkReadiness();

    expect(result.status).toBe('fail');
    expect(result.checks['database']).toEqual({ status: 'fail', error: 'pool unavailable' });
  });

  it('fails readiness when connections wait on an empty pool', async () => {
    const { cache } = aCache();
    const service = new HealthCheckService(
      null,
      null,
      cache,
      aSequelize({ size: 0, waiting: 3 }),
      60,
      hiddenLogger,
    );

    const result = await service.checkReadiness();

    expect(result.status).toBe('fail');
    expect(result.checks['database']).toEqual({ status: 'fail', error: 'database unavailable' });
  });

  it('only checks cache and database when websocket and rabbitmq are absent', async () => {
    const { cache } = aCache();
    const service = new HealthCheckService(null, undefined, cache, aSequelize(), 60, hiddenLogger);

    const result = await service.checkReadiness();

    expect(result.status).toBe('pass');
    expect(Object.keys(result.checks)).toEqual(['cache', 'database']);
  });

  it('omits the schema check until a report is set', async () => {
    const { cache } = aCache();
    const service = new HealthCheckService(null, null, cache, aSequelize(), 60, hiddenLogger);

    const result = await service.checkReadiness();

    expect(result.checks['schema']).toBeUndefined();
  });

  it('warns without failing readiness when the schema report holds suppressed errors', async () => {
    const { cache } = aCache();
    const service = new HealthCheckService(null, null, cache, aSequelize(), 60, hiddenLogger);
    service.setSchemaValidationReport(aSchemaReport([aFinding('column a missing')]));

    const result = await service.checkReadiness();

    expect(result.status).toBe('pass');
    expect(result.checks['schema']).toEqual({
      status: 'warn',
      error:
        '1 schema validation error(s) suppressed by validateSchemaSeverity=warn: column a missing',
    });
  });

  it('lists at most five suppressed schema errors', async () => {
    const { cache } = aCache();
    const service = new HealthCheckService(null, null, cache, aSequelize(), 60, hiddenLogger);
    service.setSchemaValidationReport(
      aSchemaReport(Array.from({ length: 6 }, (_, i) => aFinding(`finding ${i}`))),
    );

    const result = await service.checkReadiness();

    expect(result.checks['schema'].error).toBe(
      '6 schema validation error(s) suppressed by validateSchemaSeverity=warn: ' +
        'finding 0; finding 1; finding 2; finding 3; finding 4',
    );
  });

  it('reports warning-only findings as a count', async () => {
    const { cache } = aCache();
    const service = new HealthCheckService(null, null, cache, aSequelize(), 60, hiddenLogger);
    service.setSchemaValidationReport(aSchemaReport([], [aFinding('wider column', 'warning')]));

    const result = await service.checkReadiness();

    expect(result.status).toBe('pass');
    expect(result.checks['schema']).toEqual({
      status: 'warn',
      error: '1 schema validation warning(s)',
    });
  });

  it('passes the schema check for a clean report', async () => {
    const { cache } = aCache();
    const service = new HealthCheckService(null, null, cache, aSequelize(), 60, hiddenLogger);
    service.setSchemaValidationReport(aSchemaReport());

    const result = await service.checkReadiness();

    expect(result.checks['schema']).toEqual({ status: 'pass' });
  });

  it('fails readiness without touching dependencies once shutdown has started', async () => {
    const { cache, ping } = aCache();
    const service = new HealthCheckService(null, null, cache, aSequelize(), 60, hiddenLogger);

    service.shutdown();
    const result = await service.checkReadiness();

    expect(result).toEqual({
      status: 'fail',
      checks: { shutdown: { status: 'fail', error: 'shutting down' } },
    });
    expect(ping).not.toHaveBeenCalled();
  });

  it('fails liveness after readiness has been failing longer than the threshold', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const { cache } = aCache();
    const { manager } = aConnectionManager(() => false);
    const service = new HealthCheckService(null, manager, cache, aSequelize(), 1, hiddenLogger);

    await service.checkReadiness();
    expect(service.checkLiveness()).toEqual({ status: 'pass', checks: {} });

    vi.setSystemTime(new Date('2026-01-01T00:00:03Z'));
    expect(service.checkLiveness()).toEqual({
      status: 'fail',
      checks: {
        readiness: { status: 'fail', error: 'Not ready for 3s (threshold: 1s)' },
      },
    });
  });

  it('passes liveness again once readiness recovers', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    let connected = false;
    const { cache } = aCache();
    const { manager } = aConnectionManager(() => connected);
    const service = new HealthCheckService(null, manager, cache, aSequelize(), 1, hiddenLogger);

    await service.checkReadiness();
    vi.setSystemTime(new Date('2026-01-01T00:00:05Z'));
    connected = true;
    await service.checkReadiness();

    expect(service.checkLiveness()).toEqual({ status: 'pass', checks: {} });
  });
});

describe('LocalBypassAuthProvider', () => {
  it('hands out the fixed bypass token', async () => {
    const provider = new LocalBypassAuthProvider(hiddenLogger);

    await expect(provider.extractToken({} as FastifyRequest)).resolves.toBe('local-bypass-token');
  });

  it('authenticates any token as the local admin user', async () => {
    const provider = new LocalBypassAuthProvider(hiddenLogger);

    const result = await provider.authenticateToken('whatever');

    expect(result.isAuthenticated).toBe(true);
    expect(result.user).toEqual({
      id: 'local-admin',
      name: 'Local Admin',
      email: 'admin@local',
      roles: ['admin', 'user'],
      groups: ['administrators'],
      tenantId: '1',
      metadata: { isLocalBypass: true },
    });
  });

  it('authorizes any user for any request', async () => {
    const provider = new LocalBypassAuthProvider(hiddenLogger);
    const user = (await provider.authenticateToken('whatever')).user!;

    const result = await provider.authorizeUser(user, {
      method: 'DELETE',
      url: '/anything',
    } as FastifyRequest);

    expect(result.isAuthorized).toBe(true);
  });
});

describe('OidcTokenProvider', () => {
  const oidcConfig = {
    tokenUrl: 'http://idp.test/token',
    clientId: 'client-1',
    clientSecret: 's3cret',
    audience: 'aud-1',
  };

  function tokenResponse(accessToken: string, expiresIn = 3600) {
    return { ok: true, json: async () => ({ access_token: accessToken, expires_in: expiresIn }) };
  }

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests a token with the client credentials grant', async () => {
    fetchMock.mockResolvedValue(tokenResponse('tok-1'));
    const provider = new OidcTokenProvider(oidcConfig, hiddenLogger);

    await expect(provider.getToken()).resolves.toBe('tok-1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: URLSearchParams },
    ];
    expect(url).toBe('http://idp.test/token');
    expect(init.method).toBe('POST');
    expect(init.body.get('grant_type')).toBe('client_credentials');
    expect(init.body.get('client_id')).toBe('client-1');
    expect(init.body.get('client_secret')).toBe('s3cret');
    expect(init.body.get('audience')).toBe('aud-1');
  });

  it('reuses the cached token while it is still valid', async () => {
    fetchMock.mockResolvedValue(tokenResponse('tok-1'));
    const provider = new OidcTokenProvider(oidcConfig, hiddenLogger);

    await provider.getToken();
    await expect(provider.getToken()).resolves.toBe('tok-1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches a fresh token once the cached one expires', async () => {
    // expires_in of 60 leaves nothing after the 60s safety margin, so the cache entry is already stale
    fetchMock
      .mockResolvedValueOnce(tokenResponse('tok-1', 60))
      .mockResolvedValueOnce(tokenResponse('tok-2'));
    const provider = new OidcTokenProvider(oidcConfig, hiddenLogger);

    await expect(provider.getToken()).resolves.toBe('tok-1');
    await expect(provider.getToken()).resolves.toBe('tok-2');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws when the token endpoint answers with an error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
      text: async () => 'invalid client',
    });
    const provider = new OidcTokenProvider(oidcConfig, hiddenLogger);

    await expect(provider.getToken()).rejects.toThrow('Failed to fetch OIDC token: Unauthorized');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('RbacRulesLoader', () => {
  type LoaderInternals = { loadRules(filePath: string): Promise<void> };

  const rules = {
    '1': {
      '/api/users': { GET: ['admin'], '*': ['superadmin'] },
      '/api/orders/:id': { GET: ['viewer'] },
      '/files/*': { '*': ['file-admin'] },
    },
  };

  let rbacDir: string;
  let rulesFile: string;

  beforeAll(() => {
    rbacDir = tempDir('citrine-rbac-');
    rulesFile = path.join(rbacDir, 'rules.json');
    fs.writeFileSync(rulesFile, JSON.stringify(rules));
  });

  // The constructor loads rules fire-and-forget; awaiting the private loadRules keeps assertions deterministic.
  async function aLoadedLoader(file: string = rulesFile): Promise<RbacRulesLoader> {
    const loader = new RbacRulesLoader(file, hiddenLogger);
    await (loader as unknown as LoaderInternals).loadRules(file);
    return loader;
  }

  it('resolves roles for an exact url and case-insensitive method', async () => {
    const loader = await aLoadedLoader();

    expect(loader.getRequiredRoles('1', '/api/users', 'get')).toEqual(['admin']);
  });

  it('falls back to the method wildcard on an exact url', async () => {
    const loader = await aLoadedLoader();

    expect(loader.getRequiredRoles('1', '/api/users', 'POST')).toEqual(['superadmin']);
  });

  it('strips query string and trailing slash before matching', async () => {
    const loader = await aLoadedLoader();

    expect(loader.getRequiredRoles('1', '/api/users/?page=2', 'GET')).toEqual(['admin']);
    expect(loader.getRequiredRoles('1', 'api/users', 'GET')).toEqual(['admin']);
  });

  it('matches path-parameter patterns per method', async () => {
    const loader = await aLoadedLoader();

    expect(loader.getRequiredRoles('1', '/api/orders/42', 'GET')).toEqual(['viewer']);
    expect(loader.getRequiredRoles('1', '/api/orders/42', 'DELETE')).toBeNull();
  });

  it('matches wildcard patterns for any method', async () => {
    const loader = await aLoadedLoader();

    expect(loader.getRequiredRoles('1', '/files/reports/2024', 'POST')).toEqual(['file-admin']);
  });

  it('returns null for an unknown tenant or unmapped url', async () => {
    const loader = await aLoadedLoader();

    expect(loader.getRequiredRoles('2', '/api/users', 'GET')).toBeNull();
    expect(loader.getRequiredRoles('1', '/unmapped', 'GET')).toBeNull();
  });

  it('keeps empty rules when the rules file does not exist', async () => {
    const loader = await aLoadedLoader(path.join(rbacDir, 'missing.json'));

    expect(loader.getRequiredRoles('1', '/api/users', 'GET')).toBeNull();
  });

  it('rejects rules that fail schema validation', async () => {
    const invalidFile = path.join(rbacDir, 'invalid.json');
    // roles must be an array of strings
    fs.writeFileSync(invalidFile, JSON.stringify({ '1': { '/x': { GET: 'admin' } } }));
    const loader = new RbacRulesLoader(invalidFile, hiddenLogger);

    await expect((loader as unknown as LoaderInternals).loadRules(invalidFile)).rejects.toThrow(
      'Invalid RBAC rules format',
    );
    expect(loader.getRequiredRoles('1', '/x', 'GET')).toBeNull();
  });

  it('wraps parse failures for an unreadable rules file', async () => {
    const garbageFile = path.join(rbacDir, 'garbage.json');
    fs.writeFileSync(garbageFile, 'not-json');
    const loader = new RbacRulesLoader(garbageFile, hiddenLogger);

    await expect((loader as unknown as LoaderInternals).loadRules(garbageFile)).rejects.toThrow(
      /^Failed to load RBAC rules:/,
    );
  });
});

describe('UrlMatcher', () => {
  it('matches an identical url only', () => {
    expect(UrlMatcher.match('/api/users', '/api/users')).toBe(true);
    expect(UrlMatcher.match('/api/user', '/api/users')).toBe(false);
  });

  it('matches any subpath for a trailing wildcard', () => {
    expect(UrlMatcher.match('/files/a', '/files/*')).toBe(true);
    expect(UrlMatcher.match('/files/a/b', '/files/*')).toBe(true);
    expect(UrlMatcher.match('/files/', '/files/*')).toBe(true);
  });

  it('does not match the bare base path against a wildcard', () => {
    expect(UrlMatcher.match('/files', '/files/*')).toBe(false);
  });

  it('accepts any value for a path-parameter segment', () => {
    expect(UrlMatcher.match('/users/42', '/users/:id')).toBe(true);
    expect(UrlMatcher.match('/users/42/orders', '/users/:id')).toBe(false);
    expect(UrlMatcher.match('/orders/42', '/users/:id')).toBe(false);
  });

  it('matches multiple path parameters in one pattern', () => {
    expect(UrlMatcher.match('/t/1/x/2', '/t/:a/x/:b')).toBe(true);
    expect(UrlMatcher.match('/t/1/y/2', '/t/:a/x/:b')).toBe(false);
  });
});
