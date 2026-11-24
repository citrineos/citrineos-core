// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getDatabaseConfigForEnv,
  getPaymentConfigForEnv,
  loadPaymentConfig,
} from '../src/config/loader.js';
import { createLocalPaymentConfig } from '../src/config/envs/local.js';
import { AppEnv, CoreAuthMode } from '../src/config/types.js';

function stubSecrets() {
  vi.stubEnv('PAYMENT_CALLBACK_SECRET', 'a-callback-secret-that-is-long-enough!');
  vi.stubEnv('STRIPE_API_KEY', 'sk_test_123');
  vi.stubEnv('STRIPE_CONNECT_WEBHOOK_SECRET', 'whsec_123');
}

describe('getPaymentConfigForEnv', () => {
  beforeEach(stubSecrets);

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the local defaults when APP_ENV is unset', () => {
    const config = getPaymentConfigForEnv(undefined);
    expect(config.server).toEqual({ host: '0.0.0.0', port: 9010, trustProxy: false });
    expect(config.database.host).toBe('localhost');
    expect(config.logLevel).toBe(2);
    expect(config.core).toEqual({
      url: 'http://localhost:8080',
      headers: {},
      tenantHeaders: {},
      authMode: CoreAuthMode.LocalDev,
      localDevRoles: ['admin'],
    });
    expect(config.admin).toEqual({});
    expect(config.rateLimitPerMinute).toBe(20);
    expect(config.reconciliation).toEqual({ intervalSeconds: 60, staleAfterSeconds: 600 });
    expect(config.amqp).toEqual({
      url: 'amqp://guest:guest@localhost:5672',
      exchange: 'citrineos',
      queue: 'payment',
    });
    expect(config.idTokenPrefix).toBe('PAY_');
  });

  it('uses the docker defaults when APP_ENV is docker', () => {
    const config = getPaymentConfigForEnv(AppEnv.Docker);
    expect(config.database.host).toBe('ocpp-db');
    expect(config.core.authMode).toBe(CoreAuthMode.Headers);
    expect(config.core.url).toBe('http://citrine:8080');
    expect(config.amqp.url).toBe('amqp://guest:guest@amqp-broker:5672');
  });

  it('applies environment overrides', () => {
    vi.stubEnv('PAYMENT_PORT', '9999');
    vi.stubEnv('DB_HOST', 'db.internal');
    vi.stubEnv('DB_PORT', '6543');
    vi.stubEnv('DB_NAME', 'payments');
    vi.stubEnv('DB_USER', 'payment');
    vi.stubEnv('DB_PASS', 'secret');
    vi.stubEnv('LOG_LEVEL', '4');
    vi.stubEnv('PAYMENT_PUBLIC_URL', 'https://pay.example.com');
    vi.stubEnv('CORE_HEADERS', '{"Authorization":"Bearer a"}');
    vi.stubEnv('CORE_TENANT_HEADERS', '{"2":{"Authorization":"Bearer b"}}');
    vi.stubEnv('AMQP_QUEUE', 'payment-eu');

    const config = getPaymentConfigForEnv(AppEnv.Local);

    expect(config.server.port).toBe(9999);
    expect(config.database).toEqual({
      host: 'db.internal',
      port: 6543,
      database: 'payments',
      username: 'payment',
      password: 'secret',
    });
    expect(config.logLevel).toBe(4);
    expect(config.publicUrl).toBe('https://pay.example.com');
    expect(config.core.headers).toEqual({ Authorization: 'Bearer a' });
    expect(config.core.tenantHeaders).toEqual({ '2': { Authorization: 'Bearer b' } });
    expect(config.amqp.queue).toBe('payment-eu');
  });

  it('sends Core the configured headers locally when CORE_AUTH_MODE is headers', () => {
    vi.stubEnv('CORE_AUTH_MODE', CoreAuthMode.Headers);

    expect(getPaymentConfigForEnv(AppEnv.Local).core.authMode).toBe(CoreAuthMode.Headers);
  });

  it('reads how Core, admins and the sweep are set up', () => {
    vi.stubEnv('PAYMENT_TRUST_PROXY', 'true');
    vi.stubEnv('CORE_AUTH_MODE', CoreAuthMode.LocalDev);
    vi.stubEnv('CORE_LOCAL_DEV_ROLES', 'admin, operator');
    vi.stubEnv('PAYMENT_ADMIN_API_KEY', 'an-admin-api-key-that-is-long-enough');
    vi.stubEnv('PAYMENT_RATE_LIMIT_PER_MINUTE', '0');
    vi.stubEnv('PAYMENT_RECONCILE_INTERVAL_SECONDS', '30');
    vi.stubEnv('PAYMENT_RECONCILE_STALE_AFTER_SECONDS', '900');

    const config = getPaymentConfigForEnv(AppEnv.Docker);

    expect(config.server.trustProxy).toBe(true);
    expect(config.core.authMode).toBe(CoreAuthMode.LocalDev);
    expect(config.core.localDevRoles).toEqual(['admin', 'operator']);
    expect(config.admin).toEqual({ apiKey: 'an-admin-api-key-that-is-long-enough' });
    expect(config.rateLimitPerMinute).toBe(0);
    expect(config.reconciliation).toEqual({ intervalSeconds: 30, staleAfterSeconds: 900 });
  });

  it.each([
    ['an admin API key too short to guess at', 'PAYMENT_ADMIN_API_KEY', 'short'],
    ['a sweep that acts within a minute', 'PAYMENT_RECONCILE_STALE_AFTER_SECONDS', '30'],
  ])('rejects %s', (_name, variable, value) => {
    vi.stubEnv(variable, value);
    expect(() => getPaymentConfigForEnv(AppEnv.Local)).toThrow();
  });

  it('rejects a port that is not a number', () => {
    vi.stubEnv('PAYMENT_PORT', 'not-a-port');
    expect(() => getPaymentConfigForEnv(AppEnv.Local)).toThrow();
  });

  it.each(['PAYMENT_CALLBACK_SECRET', 'STRIPE_API_KEY', 'STRIPE_CONNECT_WEBHOOK_SECRET'])(
    'requires %s',
    (name) => {
      vi.stubEnv(name, '');
      expect(() => getPaymentConfigForEnv(AppEnv.Local)).toThrow();
    },
  );

  it('rejects a callback secret too short to sign with', () => {
    vi.stubEnv('PAYMENT_CALLBACK_SECRET', 'short');
    expect(() => getPaymentConfigForEnv(AppEnv.Local)).toThrow();
  });
});

describe('getDatabaseConfigForEnv', () => {
  it('reads the database settings without the secrets the server needs', () => {
    expect(getDatabaseConfigForEnv(undefined)).toEqual({
      host: 'localhost',
      port: 5432,
      database: 'citrine',
      username: 'citrine',
      password: 'citrine',
    });
  });
});

describe('loadPaymentConfig', () => {
  beforeEach(stubSecrets);

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults logLevel when it is omitted', () => {
    const { logLevel: _logLevel, ...input } = createLocalPaymentConfig();
    expect(loadPaymentConfig(input).logLevel).toBe(2);
  });

  it('rejects a logLevel outside the tslog range', () => {
    expect(() => loadPaymentConfig({ ...createLocalPaymentConfig(), logLevel: 7 })).toThrow();
  });

  it('rejects an idToken prefix that would not fit an OCPP 1.6 idTag', () => {
    expect(() =>
      loadPaymentConfig({ ...createLocalPaymentConfig(), idTokenPrefix: 'TOO_LONG_PREFIX' }),
    ).toThrow();
  });
});
