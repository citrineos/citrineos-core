// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { ocpiConfigInputSchema, ocpiConfigSchema } from '../../src/config/ocpi-types.js';
import {
  OCPI_ENV_VAR_PREFIX,
  defineOcpiConfig,
  loadOcpiConfig,
} from '../../src/config/define-ocpi-config.js';

const OCPP1_6_URLS = {
  remoteStartTransactionRequestUrl: 'http://core/ocpp16/remoteStart',
  remoteStopTransactionRequestUrl: 'http://core/ocpp16/remoteStop',
  unlockConnectorRequestUrl: 'http://core/ocpp16/unlock',
};

const OCPP2_URLS = {
  requestStartTransactionRequestUrl: 'http://core/ocpp2/requestStart',
  requestStopTransactionRequestUrl: 'http://core/ocpp2/requestStop',
  unlockConnectorRequestUrl: 'http://core/ocpp2/unlock',
};

// Placeholder for the auth fields the fixtures below carry.
const FIXTURE_VALUE = 'secret';

// Satisfies ocpiConfigSchema (the processed schema defineOcpiConfig validates
// against), which carries no defaults — every required field must be present.
// Fresh object per test: the env merge mutates nested objects in place.
function aFullConfig() {
  return {
    env: 'development' as const,
    ocpiServer: { host: '127.0.0.1', port: 8085 },
    ocpiModules: { credentials: { endpointPrefix: '/credentials' } },
    database: {
      host: 'db.internal',
      port: 5432,
      database: 'ocpi',
      username: 'ocpi',
      password: FIXTURE_VALUE,
    },
    cache: { memory: true },
    graphql: { endpoint: 'http://localhost:8090/v1/graphql' },
    commands: {
      timeout: 30,
      ocpiBaseUrl: 'http://localhost:8085/ocpi',
      ocpp1_6: OCPP1_6_URLS,
      ocpp2_0_1: OCPP2_URLS,
      ocpp2_1: OCPP2_URLS,
    },
    logLevel: 2,
    defaultPageLimit: 50,
    maxPageLimit: 1000,
  };
}

const envKeysSet: string[] = [];

function setEnv(key: string, value: string) {
  process.env[key] = value;
  envKeysSet.push(key);
}

afterEach(() => {
  for (const key of envKeysSet.splice(0)) {
    delete process.env[key];
  }
  vi.restoreAllMocks();
});

describe('ocpiConfigInputSchema', () => {
  it('parses a fully specified config unchanged', () => {
    const input = {
      ...aFullConfig(),
      ocpiModules: {
        credentials: { endpointPrefix: '/credentials' },
        versions: { endpointPrefix: '/versions' },
        locations: { endpointPrefix: '/locations' },
        sessions: { endpointPrefix: '/sessions' },
        cdrs: { endpointPrefix: '/cdrs' },
        tokens: { endpointPrefix: '/tokens' },
        tariffs: { endpointPrefix: '/tariffs' },
        chargingProfiles: { endpointPrefix: '/chargingprofiles' },
        commands: { endpointPrefix: '/commands' },
      },
      cache: { memory: true, redis: { host: 'redis.internal', port: 6379 } },
      messageBroker: {
        amqp: { url: 'amqp://rabbit:5672', exchange: 'citrineos' },
        kafka: {
          topicPrefix: 'ocpi',
          topicName: 'events',
          brokers: ['kafka1:9092', 'kafka2:9092'],
          sasl: { mechanism: 'plain', username: 'user', password: FIXTURE_VALUE },
        },
      },
      swagger: {
        path: '/docs',
        logoPath: '/logo.png',
        exposeData: false,
        exposeMessage: false,
      },
      graphql: {
        endpoint: 'http://localhost:8090/v1/graphql',
        headers: { 'x-hasura-admin-secret': FIXTURE_VALUE },
      },
      commands: {
        timeout: 60,
        ocpiBaseUrl: 'http://ocpi.example.com/ocpi',
        coreHeaders: { Authorization: 'Bearer token' },
        ocpp1_6: OCPP1_6_URLS,
        ocpp2_0_1: OCPP2_URLS,
        ocpp2_1: OCPP2_URLS,
      },
      oidc: {
        jwksUri: 'https://idp/jwks',
        issuer: 'https://idp',
        audience: 'ocpi',
        cacheTime: 600,
        rateLimit: true,
      },
    };

    expect(ocpiConfigInputSchema.parse(input)).toEqual(input);
  });

  it('fills defaults for omitted fields', () => {
    const parsed = ocpiConfigInputSchema.parse({
      env: 'production',
      ocpiServer: {},
      ocpiModules: { credentials: {}, chargingProfiles: {} },
      database: {},
      cache: { memory: true },
      graphql: { endpoint: 'http://localhost:8090/v1/graphql' },
      commands: { ocpp1_6: OCPP1_6_URLS, ocpp2_0_1: OCPP2_URLS, ocpp2_1: OCPP2_URLS },
    });

    expect(parsed.ocpiServer).toEqual({ host: '0.0.0.0', port: 8085 });
    expect(parsed.database).toEqual({
      host: 'localhost',
      port: 5432,
      database: 'ocpi',
      username: 'ocpi',
      password: '',
    });
    expect(parsed.ocpiModules.credentials).toEqual({ endpointPrefix: '/credentials' });
    expect(parsed.ocpiModules.chargingProfiles).toEqual({ endpointPrefix: '/chargingprofiles' });
    // omitted module stays absent — defaults only apply inside provided objects
    expect(parsed.ocpiModules.versions).toBeUndefined();
    expect(parsed.commands.timeout).toBe(30);
    expect(parsed.commands.ocpiBaseUrl).toBe('http://localhost:8085/ocpi');
    expect(parsed.logLevel).toBe(2);
    expect(parsed.defaultPageLimit).toBe(50);
    expect(parsed.maxPageLimit).toBe(1000);
  });

  it('fills swagger and redis defaults inside provided objects', () => {
    const parsed = ocpiConfigInputSchema.parse({
      ...aFullConfig(),
      cache: { redis: {} },
      swagger: { logoPath: '/logo.png' },
    });

    expect(parsed.swagger).toEqual({
      path: '/docs',
      logoPath: '/logo.png',
      exposeData: true,
      exposeMessage: true,
    });
    expect(parsed.cache.redis).toEqual({ host: 'localhost', port: 6379 });
  });

  it('rejects a cache with neither memory nor redis', () => {
    const result = ocpiConfigInputSchema.safeParse({ ...aFullConfig(), cache: {} });

    expect(result.success).toBe(false);
    expect(result.error!.issues).toEqual([
      expect.objectContaining({
        code: 'custom',
        path: ['cache'],
        message: 'A cache implementation must be set',
      }),
    ]);
  });

  it('accepts a redis-only cache', () => {
    const parsed = ocpiConfigInputSchema.parse({
      ...aFullConfig(),
      cache: { redis: { host: 'redis.internal', port: 6380 } },
    });

    expect(parsed.cache).toEqual({ redis: { host: 'redis.internal', port: 6380 } });
  });

  it('rejects an unknown env value with the enum options', () => {
    const result = ocpiConfigInputSchema.safeParse({ ...aFullConfig(), env: 'staging' });

    expect(result.success).toBe(false);
    const issue = result.error!.issues.find((i) => i.path[0] === 'env');
    expect(issue!.message).toBe('Invalid option: expected one of "development"|"production"');
  });

  it('rejects logLevel above 6', () => {
    const result = ocpiConfigInputSchema.safeParse({ ...aFullConfig(), logLevel: 9 });

    expect(result.success).toBe(false);
    const issue = result.error!.issues.find((i) => i.path[0] === 'logLevel');
    expect(issue!.message).toBe('Too big: expected number to be <=6');
  });

  it('rejects a non-positive server port', () => {
    const result = ocpiConfigInputSchema.safeParse({
      ...aFullConfig(),
      ocpiServer: { port: 0 },
    });

    expect(result.success).toBe(false);
    const issue = result.error!.issues.find((i) => i.path.join('.') === 'ocpiServer.port');
    expect(issue!.message).toBe('Too small: expected number to be >0');
  });
});

describe('ocpiConfigSchema', () => {
  it('has no defaults: an empty ocpiServer fails', () => {
    const result = ocpiConfigSchema.safeParse({ ...aFullConfig(), ocpiServer: {} });

    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('ocpiServer.host');
    expect(paths).toContain('ocpiServer.port');
  });
});

describe('defineOcpiConfig', () => {
  it('uses the citrineos_ocpi_ prefix when no --env-prefix arg is given', () => {
    expect(OCPI_ENV_VAR_PREFIX).toBe('citrineos_ocpi_');
  });

  it('returns the config unchanged when no prefixed env vars are set', () => {
    expect(defineOcpiConfig(aFullConfig())).toEqual(aFullConfig());
  });

  it('overrides a nested string and leaves siblings untouched', () => {
    setEnv('CITRINEOS_OCPI_DATABASE_HOST', 'env-db-host');

    const config = defineOcpiConfig(aFullConfig());

    expect(config.database.host).toBe('env-db-host');
    expect(config.database.username).toBe('ocpi');
  });

  it('overrides a top-level key', () => {
    setEnv('CITRINEOS_OCPI_ENV', 'production');

    expect(defineOcpiConfig(aFullConfig()).env).toBe('production');
  });

  it('coerces a numeric env value so it passes int validation', () => {
    setEnv('CITRINEOS_OCPI_OCPISERVER_PORT', '9090');

    expect(defineOcpiConfig(aFullConfig()).ocpiServer.port).toBe(9090);
  });

  it('matches env var keys case-insensitively', () => {
    setEnv('CiTrInEoS_OcPi_DaTaBaSe_PaSsWoRd', 'from-env');

    expect(defineOcpiConfig(aFullConfig()).database.password).toBe('from-env');
  });

  // Only an all-lowercase leaf key works here: the merge writes camelCase
  // leaves (exposeData, logLevel, ...) under a lowercased name that the
  // schema strips — see define-ocpi-config.ts:108.
  it('coerces "false" to a boolean', () => {
    setEnv('CITRINEOS_OCPI_CACHE_MEMORY', 'false');

    const config = defineOcpiConfig({
      ...aFullConfig(),
      cache: { memory: true, redis: { host: 'redis.internal', port: 6379 } },
    });

    expect(config.cache.memory).toBe(false);
    expect(config.cache.redis).toEqual({ host: 'redis.internal', port: 6379 });
  });

  it('creates missing intermediate objects and parses JSON arrays', () => {
    setEnv('CITRINEOS_OCPI_MESSAGEBROKER_KAFKA_BROKERS', '["kafka1:9092","kafka2:9092"]');

    const config = defineOcpiConfig(aFullConfig());

    expect(config.messageBroker!.kafka!.brokers).toEqual(['kafka1:9092', 'kafka2:9092']);
  });

  it('warns on an unmappable middle path part and leaves the config unchanged', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setEnv('CITRINEOS_OCPI_BOGUS_THING', 'x');

    const config = defineOcpiConfig(aFullConfig());

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('Environment variable mapping errors:', [
      'Invalid environment variable key: CITRINEOS_OCPI_BOGUS_THING (part: bogus)',
    ]);
    expect(config).toEqual(aFullConfig());
  });

  it('warns on an unmappable final path part', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setEnv('CITRINEOS_OCPI_DATABASE_BOGUS', 'x');

    const config = defineOcpiConfig(aFullConfig());

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('Environment variable mapping errors:', [
      'Invalid environment variable key: CITRINEOS_OCPI_DATABASE_BOGUS (final part: bogus)',
    ]);
    expect(config.database).toEqual(aFullConfig().database);
  });

  it('throws a ZodError when a required section is missing', () => {
    const { graphql: _graphql, ...withoutGraphql } = aFullConfig();

    expect(() => defineOcpiConfig(withoutGraphql as never)).toThrow(ZodError);
    expect(() => defineOcpiConfig(withoutGraphql as never)).toThrow(
      /expected object, received undefined/,
    );
  });
});

describe('loadOcpiConfig', () => {
  it('returns the validated config and logs both phases', () => {
    const logger = { info: vi.fn(), error: vi.fn() };

    const config = loadOcpiConfig(aFullConfig(), logger as never);

    expect(config).toEqual(aFullConfig());
    expect(logger.info).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenNthCalledWith(1, 'Loading OCPI configuration...');
    expect(logger.info).toHaveBeenNthCalledWith(2, 'OCPI configuration loaded successfully');
    expect(logger.error).toHaveBeenCalledTimes(0);
  });

  it('works without a logger', () => {
    expect(loadOcpiConfig(aFullConfig()).database.host).toBe('db.internal');
  });

  it('logs and rethrows on invalid config', () => {
    const logger = { info: vi.fn(), error: vi.fn() };
    const { cache: _cache, ...withoutCache } = aFullConfig();

    expect(() => loadOcpiConfig(withoutCache as never, logger as never)).toThrow(ZodError);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to load OCPI configuration:',
      expect.any(ZodError),
    );
  });
});
