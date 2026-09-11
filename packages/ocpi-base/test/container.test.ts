// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import 'reflect-metadata';
// The barrel must load first: module classes and container.ts sit inside an
// import cycle that only resolves cleanly in the barrel's evaluation order.
import type { OcpiConfig } from '../src/index.js';
import {
  buildOcpiContainer,
  CacheWrapper,
  OcpiGraphqlClient,
  ConnectorMapper,
  EvseMapper,
  LocationMapper,
  TokensMapper,
  SessionMapper,
  CdrMapper,
  TokensClientApi,
  VersionsClientApi,
  LocationsClientApi,
  CdrsService,
  ChargingProfilesService,
  CommandsService,
  CredentialsService,
  LocationsService,
  SessionsService,
  TariffsService,
  TokensService,
  VersionService,
  CommandExecutor,
  CdrBroadcaster,
  LocationsBroadcaster,
  SessionBroadcaster,
  TariffsBroadcaster,
  AuthMiddleware,
  RegistrationAuthMiddleware,
  OcpiExceptionHandler,
  OCPP1_6_CommandHandler,
  OCPP2_0_1_CommandHandler,
  OCPP2_1_CommandHandler,
  RabbitMqDtoSender,
  RabbitMqDtoReceiver,
  PgNotifyEventSubscriber,
  DtoRouter,
  CdrsModule,
  ChargingProfilesModule,
  CommandsModule,
  CredentialsModule,
  LocationsModule,
  SessionsModule,
  TariffsModule,
  TokensModule,
  VersionsModule,
} from '../src/index.js';
import { CdrsClientApi } from '../src/trigger/cdrs-client-api.js';
import { CommandsClientApi } from '../src/trigger/commands-client-api.js';
import { CredentialsClientApi } from '../src/trigger/credentials-client-api.js';
import { SessionsClientApi } from '../src/trigger/sessions-client-api.js';
import { TariffsClientApi } from '../src/trigger/tariffs-client-api.js';
import { AdminAuthMiddleware } from '../src/util/middleware/admin-auth-middleware.js';
import { HttpExceptionHandler } from '../src/util/middleware/http-exception-handler.js';
import { OcpiHeaderMiddleware } from '../src/util/middleware/ocpi-header-middleware.js';
import { PaginatedMiddleware } from '../src/util/middleware/paginated-middleware.js';
import { UniqueMessageIdsMiddleware } from '../src/util/middleware/unique-message-ids-middleware.js';
import { CdrsModuleApi } from '../src/modules/cdrs/module/cdrs-module-api.js';
import { ChargingProfilesModuleApi } from '../src/modules/charging-profiles/module/charging-profiles-module-api.js';
import { CommandsModuleApi } from '../src/modules/commands/module/commands-module-api.js';
import { CredentialsModuleApi } from '../src/modules/credentials/module/credentials-module-api.js';
import { LocationsModuleApi } from '../src/modules/locations/module/locations-module-api.js';
import { SessionsModuleApi } from '../src/modules/sessions/module/sessions-module-api.js';
import { TariffsModuleApi } from '../src/modules/tariffs/module/tariffs-module-api.js';
import { TokensModuleApi } from '../src/modules/tokens/module/tokens-module-api.js';
import { VersionsModuleApi } from '../src/modules/versions/module/versions-module-api.js';
import { HealthController } from '../src/util/koa-server-health-controller.js';
import { getFromContainer } from 'routing-controllers';
import type { Ajv } from 'ajv';
import { describe, expect, it, vi } from 'vitest';

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

const FIXTURE_VALUE = 'secret';

// Minimal valid parsed config (ocpiConfigSchema shape, no defaults applied).
function aConfig(): OcpiConfig {
  return {
    env: 'development',
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
    graphql: {
      endpoint: 'http://localhost:8090/v1/graphql',
      headers: { 'x-hasura-admin-secret': FIXTURE_VALUE },
    },
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
  } as OcpiConfig;
}

type LoggerStub = {
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  getSubLogger: ReturnType<typeof vi.fn>;
};

// getSubLogger returns a fresh stub so per-class sublogger calls stay separable.
function aLogger(): LoggerStub {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    getSubLogger: vi.fn(() => aLogger()),
  };
}

function aCache() {
  return { get: vi.fn(), set: vi.fn(), remove: vi.fn() };
}

function build() {
  const config = aConfig();
  const logger = aLogger();
  const cache = aCache();
  const container = buildOcpiContainer(config, { logger, cache } as never);
  return { container, config, logger, cache };
}

const EXPECTED_TOKENS = [
  'adminAuthMiddleware',
  'ajv',
  'authMiddleware',
  'cache',
  'cacheWrapper',
  'cdrBroadcaster',
  'cdrMapper',
  'cdrsClientApi',
  'cdrsModule',
  'cdrsModuleApi',
  'cdrsService',
  'chargingProfilesModule',
  'chargingProfilesModuleApi',
  'chargingProfilesService',
  'commandExecutor',
  'commandsClientApi',
  'commandsModule',
  'commandsModuleApi',
  'commandsService',
  'config',
  'connectorMapper',
  'credentialsClientApi',
  'credentialsModule',
  'credentialsModuleApi',
  'credentialsService',
  'dtoEventReceiverFactory',
  'dtoRouter',
  'evseMapper',
  'handlers',
  'healthController',
  'httpExceptionHandler',
  'locationMapper',
  'locationsBroadcaster',
  'locationsClientApi',
  'locationsModule',
  'locationsModuleApi',
  'locationsService',
  'logger',
  'ocpiExceptionHandler',
  'ocpiGraphqlClient',
  'ocpiHeaderMiddleware',
  'ocpp16CommandHandler',
  'ocpp201CommandHandler',
  'ocpp21CommandHandler',
  'paginatedMiddleware',
  'pgNotifyEventSubscriber',
  'rabbitMqDtoSender',
  'registrationAuthMiddleware',
  'sessionBroadcaster',
  'sessionMapper',
  'sessionsClientApi',
  'sessionsModule',
  'sessionsModuleApi',
  'sessionsService',
  'tariffsBroadcaster',
  'tariffsClientApi',
  'tariffsModule',
  'tariffsModuleApi',
  'tariffsService',
  'tokensClientApi',
  'tokensMapper',
  'tokensModule',
  'tokensModuleApi',
  'tokensService',
  'uniqueMessageIdsMiddleware',
  'versionService',
  'versionsClientApi',
  'versionsModule',
  'versionsModuleApi',
];

// Every asClass registration: token -> exact class.
const CLASS_REGISTRATIONS: Array<[string, new (...args: never[]) => unknown]> = [
  ['connectorMapper', ConnectorMapper],
  ['evseMapper', EvseMapper],
  ['locationMapper', LocationMapper],
  ['tokensMapper', TokensMapper],
  ['sessionMapper', SessionMapper],
  ['cdrMapper', CdrMapper],
  ['cdrsClientApi', CdrsClientApi],
  ['commandsClientApi', CommandsClientApi],
  ['credentialsClientApi', CredentialsClientApi],
  ['locationsClientApi', LocationsClientApi],
  ['sessionsClientApi', SessionsClientApi],
  ['tariffsClientApi', TariffsClientApi],
  ['tokensClientApi', TokensClientApi],
  ['versionsClientApi', VersionsClientApi],
  ['cdrsService', CdrsService],
  ['chargingProfilesService', ChargingProfilesService],
  ['commandsService', CommandsService],
  ['credentialsService', CredentialsService],
  ['locationsService', LocationsService],
  ['sessionsService', SessionsService],
  ['tariffsService', TariffsService],
  ['tokensService', TokensService],
  ['versionService', VersionService],
  ['commandExecutor', CommandExecutor],
  ['cdrBroadcaster', CdrBroadcaster],
  ['locationsBroadcaster', LocationsBroadcaster],
  ['sessionBroadcaster', SessionBroadcaster],
  ['tariffsBroadcaster', TariffsBroadcaster],
  ['adminAuthMiddleware', AdminAuthMiddleware],
  ['authMiddleware', AuthMiddleware],
  ['registrationAuthMiddleware', RegistrationAuthMiddleware],
  ['httpExceptionHandler', HttpExceptionHandler],
  ['ocpiExceptionHandler', OcpiExceptionHandler],
  ['ocpiHeaderMiddleware', OcpiHeaderMiddleware],
  ['paginatedMiddleware', PaginatedMiddleware],
  ['uniqueMessageIdsMiddleware', UniqueMessageIdsMiddleware],
  ['ocpp16CommandHandler', OCPP1_6_CommandHandler],
  ['ocpp201CommandHandler', OCPP2_0_1_CommandHandler],
  ['ocpp21CommandHandler', OCPP2_1_CommandHandler],
  ['rabbitMqDtoSender', RabbitMqDtoSender],
  ['pgNotifyEventSubscriber', PgNotifyEventSubscriber],
  ['dtoRouter', DtoRouter],
  ['cdrsModule', CdrsModule],
  ['chargingProfilesModule', ChargingProfilesModule],
  ['commandsModule', CommandsModule],
  ['credentialsModule', CredentialsModule],
  ['locationsModule', LocationsModule],
  ['sessionsModule', SessionsModule],
  ['tariffsModule', TariffsModule],
  ['tokensModule', TokensModule],
  ['versionsModule', VersionsModule],
  ['cdrsModuleApi', CdrsModuleApi],
  ['chargingProfilesModuleApi', ChargingProfilesModuleApi],
  ['commandsModuleApi', CommandsModuleApi],
  ['credentialsModuleApi', CredentialsModuleApi],
  ['locationsModuleApi', LocationsModuleApi],
  ['sessionsModuleApi', SessionsModuleApi],
  ['tariffsModuleApi', TariffsModuleApi],
  ['tokensModuleApi', TokensModuleApi],
  ['versionsModuleApi', VersionsModuleApi],
  ['healthController', HealthController],
];

describe('buildOcpiContainer', () => {
  it('registers exactly the expected token set', () => {
    const { container } = build();

    expect(Object.keys(container.registrations).sort()).toEqual(EXPECTED_TOKENS);
  });

  it('exposes config, logger, and cache by reference', () => {
    const { container, config, logger, cache } = build();

    expect(container.resolve('config')).toBe(config);
    expect(container.resolve('logger')).toBe(logger);
    expect(container.resolve('cache')).toBe(cache);
  });

  it('cacheWrapper wraps the provided cache', () => {
    const { container, cache } = build();

    const wrapper = container.resolve<CacheWrapper>('cacheWrapper');

    expect(wrapper).toBeInstanceOf(CacheWrapper);
    expect(wrapper.cache).toBe(cache);
  });

  it('ajv is configured for OCPI payload coercion and date-time formats', () => {
    const { container } = build();

    const ajv = container.resolve<Ajv>('ajv');

    expect(ajv.opts.removeAdditional).toBe('all');
    expect(ajv.opts.useDefaults).toBe(true);
    expect(ajv.opts.coerceTypes).toBe('array');
    expect(ajv.opts.strict).toBe(false);
    const validate = ajv.compile({ type: 'string', format: 'date-time' });
    expect(validate('2026-01-01T00:00:00Z')).toBe(true);
    expect(validate('not-a-date')).toBe(false);
  });

  it('ocpiGraphqlClient targets the configured endpoint', () => {
    const { container, config } = build();

    const gql = container.resolve<OcpiGraphqlClient>('ocpiGraphqlClient');

    expect(gql).toBeInstanceOf(OcpiGraphqlClient);
    const inner = (gql as unknown as { client: { url: string } }).client;
    expect(inner.url).toBe(config.graphql.endpoint);
  });

  describe('class registrations', () => {
    const { container } = build();

    it.each(CLASS_REGISTRATIONS)('resolves %s as its registered class', (token, Class) => {
      const resolved = container.resolve<object>(token);

      expect(resolved.constructor).toBe(Class);
      // singleton lifetime: same instance on repeat resolution
      expect(container.resolve(token)).toBe(resolved);
    });
  });

  it('handlers resolves the three OCPP handlers in protocol order', () => {
    const { container } = build();

    const handlers = container.resolve<object[]>('handlers');

    expect(handlers).toHaveLength(3);
    expect(handlers[0]).toBe(container.resolve('ocpp16CommandHandler'));
    expect(handlers[1]).toBe(container.resolve('ocpp201CommandHandler'));
    expect(handlers[2]).toBe(container.resolve('ocpp21CommandHandler'));
    expect(container.resolve('handlers')).toBe(handlers);
  });

  it('dtoEventReceiverFactory builds a new RabbitMqDtoReceiver per call', () => {
    const { container } = build();

    const factory = container.resolve<() => object>('dtoEventReceiverFactory');

    expect(typeof factory).toBe('function');
    const first = factory();
    const second = factory();
    expect(first).toBeInstanceOf(RabbitMqDtoReceiver);
    expect(second).toBeInstanceOf(RabbitMqDtoReceiver);
    expect(second).not.toBe(first);
    // the factory itself is the singleton, not its products
    expect(container.resolve('dtoEventReceiverFactory')).toBe(factory);
  });

  it('adminAuthMiddleware receives the container config', () => {
    const { container, config } = build();

    const middleware = container.resolve<AdminAuthMiddleware>('adminAuthMiddleware');

    expect((middleware as unknown as { config: OcpiConfig }).config).toBe(config);
  });

  it('commandsClientApi unwraps the raw cache from cacheWrapper', () => {
    const { container, cache } = build();

    const api = container.resolve<CommandsClientApi>('commandsClientApi');

    expect((api as unknown as { cache: object }).cache).toBe(cache);
  });

  it('construction requests a per-class sublogger', () => {
    const { container, logger } = build();

    container.resolve('pgNotifyEventSubscriber');

    expect(logger.getSubLogger).toHaveBeenCalledTimes(1);
    expect(logger.getSubLogger).toHaveBeenCalledWith({ name: 'PgNotifyEventSubscriber' });
  });

  it('separate builds produce isolated singletons', () => {
    const first = build();
    const second = build();

    const a = first.container.resolve('commandExecutor');
    const b = second.container.resolve('commandExecutor');

    expect(a).toBeInstanceOf(CommandExecutor);
    expect(b).toBeInstanceOf(CommandExecutor);
    expect(b).not.toBe(a);
  });
});

describe('IocAdapter (routing-controllers bridge)', () => {
  it('getFromContainer returns the container singleton for a registered class', () => {
    const { container } = build();

    expect(getFromContainer(CommandsService)).toBe(container.resolve('commandsService'));
    expect(getFromContainer(CdrsModuleApi)).toBe(container.resolve('cdrsModuleApi'));
    expect(getFromContainer(HealthController)).toBe(container.resolve('healthController'));
  });

  it('maps a subclass to its own token, not the parent registration', () => {
    const { container } = build();

    const registration = getFromContainer(RegistrationAuthMiddleware);

    expect(registration).toBe(container.resolve('registrationAuthMiddleware'));
    expect(registration).not.toBe(container.resolve('authMiddleware'));
  });

  it('throws for a class missing from the registry', () => {
    build();
    class NotRegistered {}

    expect(() => getFromContainer(NotRegistered)).toThrow(
      'NotRegistered is not registered in the OCPI container; register it in buildOcpiContainer',
    );
  });

  it('rebinds to the most recently built container', () => {
    const first = build();
    const second = build();

    const resolved = getFromContainer(VersionService);

    expect(resolved).toBe(second.container.resolve('versionService'));
    expect(resolved).not.toBe(first.container.resolve('versionService'));
  });
});
