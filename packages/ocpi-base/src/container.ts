// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AwilixContainer, BuildResolver, Constructor, DisposableResolver } from 'awilix';
import { asClass, asFunction, asValue, createContainer, InjectionMode } from 'awilix';
import type { ClassConstructor, IocAdapter } from 'routing-controllers';
import { useContainer } from 'routing-controllers';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import type { ICache } from '@citrineos/base';
import type { ILogObj, Logger } from 'tslog';

import type { OcpiConfig } from './config/ocpi-types.js';
import { CacheWrapper } from './util/cache-wrapper.js';
import { OcpiGraphqlClient } from './graphql/ocpi-graphql-client.js';

import { ConnectorMapper, EvseMapper, LocationMapper } from './mapper/location-mapper.js';
import { TokensMapper } from './mapper/tokens-mapper.js';
import { SessionMapper } from './mapper/session-mapper.js';
import { CdrMapper } from './mapper/cdr-mapper.js';

import { CdrsService } from './services/cdrs-service.js';
import { ChargingProfilesService } from './services/charging-profiles-service.js';
import { CommandsService } from './services/commands-service.js';
import { CredentialsService } from './services/credentials-service.js';
import { LocationsService } from './services/locations-service.js';
import { SessionsService } from './services/sessions-service.js';
import { TariffsService } from './services/tariffs-service.js';
import { TokensService } from './services/tokens-service.js';
import { VersionService } from './services/version-service.js';
import { CommandExecutor } from './util/command-executor.js';

import { CdrsClientApi } from './trigger/cdrs-client-api.js';
import { CommandsClientApi } from './trigger/commands-client-api.js';
import { CredentialsClientApi } from './trigger/credentials-client-api.js';
import { LocationsClientApi } from './trigger/locations-client-api.js';
import { SessionsClientApi } from './trigger/sessions-client-api.js';
import { TariffsClientApi } from './trigger/tariffs-client-api.js';
import { TokensClientApi } from './trigger/tokens-client-api.js';
import { VersionsClientApi } from './trigger/versions-client-api.js';

import { CdrBroadcaster } from './broadcaster/cdr-broadcaster.js';
import { LocationsBroadcaster } from './broadcaster/locations-broadcaster.js';
import { SessionBroadcaster } from './broadcaster/session-broadcaster.js';
import { TariffsBroadcaster } from './broadcaster/tariffs-broadcaster.js';

import { AdminAuthMiddleware } from './util/middleware/admin-auth-middleware.js';
import { AuthMiddleware, RegistrationAuthMiddleware } from './util/middleware/auth-middleware.js';
import { HttpExceptionHandler } from './util/middleware/http-exception-handler.js';
import { OcpiExceptionHandler } from './util/middleware/ocpi-exception-handler.js';
import { OcpiHeaderMiddleware } from './util/middleware/ocpi-header-middleware.js';
import { PaginatedMiddleware } from './util/middleware/paginated-middleware.js';
import { UniqueMessageIdsMiddleware } from './util/middleware/unique-message-ids-middleware.js';

import type { OCPPCommandHandler } from './util/ocpp-command-handlers/base.js';
import { OCPP1_6_CommandHandler } from './util/ocpp-command-handlers/ocpp-16-command-handler.js';
import { OCPP2_0_1_CommandHandler } from './util/ocpp-command-handlers/ocpp-201-command-handler.js';
import { OCPP2_1_CommandHandler } from './util/ocpp-command-handlers/ocpp-21-command-handler.js';

import type { DtoEventReceiverFactory } from './events/types.js';
import { PgNotifyEventSubscriber } from './events/pg-notify/subscriber.js';
import { RabbitMqDtoReceiver } from './events/rabbit-mq/receiver.js';
import { RabbitMqDtoSender } from './events/rabbit-mq/sender.js';
import { DtoRouter } from './modules/dto-router/router/router.js';

import { CdrsModule } from './modules/cdrs/index.js';
import { CdrsModuleApi } from './modules/cdrs/module/cdrs-module-api.js';
import { ChargingProfilesModule } from './modules/charging-profiles/index.js';
import { ChargingProfilesModuleApi } from './modules/charging-profiles/module/charging-profiles-module-api.js';
import { CommandsModule } from './modules/commands/index.js';
import { CommandsModuleApi } from './modules/commands/module/commands-module-api.js';
import { CredentialsModule } from './modules/credentials/index.js';
import { CredentialsModuleApi } from './modules/credentials/module/credentials-module-api.js';
import { LocationsModule } from './modules/locations/index.js';
import { LocationsModuleApi } from './modules/locations/module/locations-module-api.js';
import { SessionsModule } from './modules/sessions/index.js';
import { SessionsModuleApi } from './modules/sessions/module/sessions-module-api.js';
import { TariffsModule } from './modules/tariffs/index.js';
import { TariffsModuleApi } from './modules/tariffs/module/tariffs-module-api.js';
import { TokensModule } from './modules/tokens/index.js';
import { TokensModuleApi } from './modules/tokens/module/tokens-module-api.js';
import { VersionsModule } from './modules/versions/index.js';
import { VersionsModuleApi } from './modules/versions/module/versions-module-api.js';
import { HealthController } from './util/koa-server-health-controller.js';

export type OcpiPrebuilt = {
  logger: Logger<ILogObj>;
  cache: ICache;
};

const classTokens = new WeakMap<object, string>();

function singletonClass<T>(
  token: string,
  Class: Constructor<T>,
): BuildResolver<T> & DisposableResolver<T> {
  classTokens.set(Class, token);
  return asClass(Class).singleton();
}

function createIocAdapter(container: AwilixContainer): IocAdapter {
  return {
    get<T>(SomeClass: ClassConstructor<T>): T {
      const token = classTokens.get(SomeClass);
      if (!token) {
        throw new Error(
          `${SomeClass.name} is not registered in the OCPI container; register it in buildOcpiContainer`,
        );
      }
      return container.resolve<T>(token);
    },
  };
}

export function buildOcpiContainer(config: OcpiConfig, prebuilt: OcpiPrebuilt): AwilixContainer {
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  registerPrimitives(container, config, prebuilt);
  registerMappers(container);
  registerClientApis(container);
  registerServices(container);
  registerBroadcasters(container);
  registerMiddleware(container);
  registerCommandHandlers(container);
  registerEvents(container);
  registerModules(container);
  registerModuleApis(container);

  useContainer(createIocAdapter(container));

  return container;
}

function registerPrimitives(
  container: AwilixContainer,
  config: OcpiConfig,
  prebuilt: OcpiPrebuilt,
): void {
  const { logger, cache } = prebuilt;

  container.register({
    config: asValue(config),
    logger: asValue(logger),
    cache: asValue(cache),
    cacheWrapper: asFunction(({ cache: ocpiCache }) => new CacheWrapper(ocpiCache)).singleton(),

    ajv: asFunction(() => {
      const ajv = new Ajv({
        removeAdditional: 'all',
        useDefaults: true,
        coerceTypes: 'array',
        strict: false,
      });
      addFormats.default(ajv, { mode: 'fast', formats: ['date-time'] });
      return ajv;
    }).singleton(),

    ocpiGraphqlClient: asFunction(
      ({ config: ocpiConfig }) =>
        new OcpiGraphqlClient(ocpiConfig.graphql.endpoint, ocpiConfig.graphql.headers),
    ).singleton(),
  });
}

function registerMappers(container: AwilixContainer): void {
  container.register({
    connectorMapper: singletonClass('connectorMapper', ConnectorMapper),
    evseMapper: singletonClass('evseMapper', EvseMapper),
    locationMapper: singletonClass('locationMapper', LocationMapper),
    tokensMapper: singletonClass('tokensMapper', TokensMapper),
    sessionMapper: singletonClass('sessionMapper', SessionMapper),
    cdrMapper: singletonClass('cdrMapper', CdrMapper),
  });
}

function registerClientApis(container: AwilixContainer): void {
  container.register({
    cdrsClientApi: singletonClass('cdrsClientApi', CdrsClientApi),
    commandsClientApi: singletonClass('commandsClientApi', CommandsClientApi),
    credentialsClientApi: singletonClass('credentialsClientApi', CredentialsClientApi),
    locationsClientApi: singletonClass('locationsClientApi', LocationsClientApi),
    sessionsClientApi: singletonClass('sessionsClientApi', SessionsClientApi),
    tariffsClientApi: singletonClass('tariffsClientApi', TariffsClientApi),
    tokensClientApi: singletonClass('tokensClientApi', TokensClientApi),
    versionsClientApi: singletonClass('versionsClientApi', VersionsClientApi),
  });
}

function registerServices(container: AwilixContainer): void {
  container.register({
    cdrsService: singletonClass('cdrsService', CdrsService),
    chargingProfilesService: singletonClass('chargingProfilesService', ChargingProfilesService),
    commandsService: singletonClass('commandsService', CommandsService),
    credentialsService: singletonClass('credentialsService', CredentialsService),
    locationsService: singletonClass('locationsService', LocationsService),
    sessionsService: singletonClass('sessionsService', SessionsService),
    tariffsService: singletonClass('tariffsService', TariffsService),
    tokensService: singletonClass('tokensService', TokensService),
    versionService: singletonClass('versionService', VersionService),
    commandExecutor: singletonClass('commandExecutor', CommandExecutor),
  });
}

function registerBroadcasters(container: AwilixContainer): void {
  container.register({
    cdrBroadcaster: singletonClass('cdrBroadcaster', CdrBroadcaster),
    locationsBroadcaster: singletonClass('locationsBroadcaster', LocationsBroadcaster),
    sessionBroadcaster: singletonClass('sessionBroadcaster', SessionBroadcaster),
    tariffsBroadcaster: singletonClass('tariffsBroadcaster', TariffsBroadcaster),
  });
}

function registerMiddleware(container: AwilixContainer): void {
  container.register({
    adminAuthMiddleware: singletonClass('adminAuthMiddleware', AdminAuthMiddleware),
    authMiddleware: singletonClass('authMiddleware', AuthMiddleware),
    registrationAuthMiddleware: singletonClass(
      'registrationAuthMiddleware',
      RegistrationAuthMiddleware,
    ),
    httpExceptionHandler: singletonClass('httpExceptionHandler', HttpExceptionHandler),
    ocpiExceptionHandler: singletonClass('ocpiExceptionHandler', OcpiExceptionHandler),
    ocpiHeaderMiddleware: singletonClass('ocpiHeaderMiddleware', OcpiHeaderMiddleware),
    paginatedMiddleware: singletonClass('paginatedMiddleware', PaginatedMiddleware),
    uniqueMessageIdsMiddleware: singletonClass(
      'uniqueMessageIdsMiddleware',
      UniqueMessageIdsMiddleware,
    ),
  });
}

function registerCommandHandlers(container: AwilixContainer): void {
  container.register({
    ocpp16CommandHandler: singletonClass('ocpp16CommandHandler', OCPP1_6_CommandHandler),
    ocpp201CommandHandler: singletonClass('ocpp201CommandHandler', OCPP2_0_1_CommandHandler),
    ocpp21CommandHandler: singletonClass('ocpp21CommandHandler', OCPP2_1_CommandHandler),

    handlers: asFunction(
      ({
        ocpp16CommandHandler,
        ocpp201CommandHandler,
        ocpp21CommandHandler,
      }): OCPPCommandHandler[] => [
        ocpp16CommandHandler,
        ocpp201CommandHandler,
        ocpp21CommandHandler,
      ],
    ).singleton(),
  });
}

function registerEvents(container: AwilixContainer): void {
  container.register({
    rabbitMqDtoSender: singletonClass('rabbitMqDtoSender', RabbitMqDtoSender),
    pgNotifyEventSubscriber: singletonClass('pgNotifyEventSubscriber', PgNotifyEventSubscriber),
    dtoRouter: singletonClass('dtoRouter', DtoRouter),

    dtoEventReceiverFactory: asFunction(
      ({ config, logger }): DtoEventReceiverFactory =>
        () =>
          new RabbitMqDtoReceiver(config, logger),
    ).singleton(),
  });
}

const OCPI_MODULES = {
  cdrsModule: CdrsModule,
  chargingProfilesModule: ChargingProfilesModule,
  commandsModule: CommandsModule,
  credentialsModule: CredentialsModule,
  locationsModule: LocationsModule,
  sessionsModule: SessionsModule,
  tariffsModule: TariffsModule,
  tokensModule: TokensModule,
  versionsModule: VersionsModule,
};

export type OcpiModuleToken = keyof typeof OCPI_MODULES;

function registerModules(container: AwilixContainer): void {
  for (const [token, Module] of Object.entries<Constructor<object>>(OCPI_MODULES)) {
    container.register({ [token]: singletonClass(token, Module) });
  }
}

function registerModuleApis(container: AwilixContainer): void {
  container.register({
    cdrsModuleApi: singletonClass('cdrsModuleApi', CdrsModuleApi),
    chargingProfilesModuleApi: singletonClass(
      'chargingProfilesModuleApi',
      ChargingProfilesModuleApi,
    ),
    commandsModuleApi: singletonClass('commandsModuleApi', CommandsModuleApi),
    credentialsModuleApi: singletonClass('credentialsModuleApi', CredentialsModuleApi),
    locationsModuleApi: singletonClass('locationsModuleApi', LocationsModuleApi),
    sessionsModuleApi: singletonClass('sessionsModuleApi', SessionsModuleApi),
    tariffsModuleApi: singletonClass('tariffsModuleApi', TariffsModuleApi),
    tokensModuleApi: singletonClass('tokensModuleApi', TokensModuleApi),
    versionsModuleApi: singletonClass('versionsModuleApi', VersionsModuleApi),
    healthController: singletonClass('healthController', HealthController),
  });
}
