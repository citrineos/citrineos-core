// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { RoutingControllersOptions } from 'routing-controllers';
import type { AwilixContainer } from 'awilix';
import type { OcpiModuleToken } from './container.js';
import { OcpiModule } from './model/ocpi-module.js';
import { KoaServer } from './util/koa-server.js';
import Koa from 'koa';
import * as packageJson from '../package.json' with { type: 'json' };
import type { OcpiConfig } from './config/ocpi-types.js';
import type { IDtoModule } from './events/index.js';
import { HealthController } from './util/koa-server-health-controller.js';

export * from './broadcaster/index.js';
export * from './mapper/index.js';
export * from './graphql/index.js';
export type { Version } from './model/version.js';
export { BodyWithSchema } from './util/decorators/body-with-schema.js';
export { plainToClass } from './util/util.js';
export { OcpiErrorResponse, buildOcpiErrorResponse } from './model/ocpi-error-response.js';
export type { AuthorizationInfo, AuthorizationInfoResponse } from './model/authorization-info.js';
export { TokensClientApi } from './trigger/tokens-client-api.js';
export { AuthorizationInfoAllowed } from './model/authorization-info-allowed.js';
export type { PostTokenParams } from './trigger/param/tokens/post-token-params.js';
export { UnsuccessfulRequestException } from './exception/unsuccessful-request-exception.js';
export { NotFoundException } from './exception/not-found-exception.js';
export { FunctionalEndpointParams } from './util/decorators/function-endpoint-params.js';
export type { PaginatedOcpiParams } from './trigger/param/paginated-ocpi-params.js';
export type { OcpiParams } from './trigger/util/ocpi-params.js';
export type { ChargingPreferences } from './model/charging-preferences.js';
export {
  ChargingPreferencesSchema,
  ChargingPreferencesSchemaName,
} from './model/charging-preferences.js';
export { PaginatedParams } from './controllers/param/paginated-params.js';
export { Paginated } from './util/decorators/paginated.js';
export {
  OCPPCommandHandler,
  OCPP1_6_CommandHandler,
  OCPP2_0_1_CommandHandler,
  OCPP2_1_CommandHandler,
} from './util/ocpp-command-handlers/index.js';
export type { OcppCommandHandlerDependencies } from './util/ocpp-command-handlers/index.js';
export type { ChargingPreferencesResponse } from './model/charging-preferences-response.js';
export {
  ChargingPreferencesResponseSchema,
  ChargingPreferencesResponseSchemaName,
} from './model/charging-preferences-response.js';
export type { PaginatedSessionResponse, Session } from './model/session.js';
export {
  PaginatedSessionResponseSchema,
  PaginatedSessionResponseSchemaName,
} from './model/session.js';
export { Role } from './model/role.js';
export { ImageCategory } from './model/image-category.js';
export { ImageType } from './model/image-type.js';
export { CountryCode } from './util/util.js';
export { KoaServer } from './util/koa-server.js';
export { InterfaceRole } from './model/interface-role.js';
export { AlreadyRegisteredException } from './exception/already-registered-exception.js';
export { NotRegisteredException } from './exception/not-registered-exception.js';
export { VersionsClientApi } from './trigger/versions-client-api.js';
// export { ChargingProfilesClientApi } from './trigger/charging-profiles-client-api';
export type { CredentialsDTO } from './model/dto/credentials-dto.js';
export { CredentialsDTOSchema, CredentialsDTOSchemaName } from './model/dto/credentials-dto.js';
export type { AdminCredentialsRequestDTO } from './model/dto/admin-credentials-request-dto.js';
export {
  AdminCredentialsRequestDTOSchema,
  AdminCredentialsRequestDTOSchemaName,
} from './model/dto/admin-credentials-request-dto.js';
export type { SingleTokenRequest, TokenDTO, TokenResponse } from './model/dto/token-dto.js';
export {
  SingleTokenRequestSchema,
  TokenDTOSchema,
  TokenResponseSchema,
  TokenResponseSchemaName,
  TokenDTOSchemaName,
} from './model/dto/token-dto.js';

export type { OcpiConfig, OcpiConfigInput } from './config/ocpi-types.js';
export { defineOcpiConfig } from './config/define-ocpi-config.js';
export { getOcpiSystemConfig } from './config/loader.js';
export type { ServerConfig } from './config/server-config.js';
export { Env } from './config/server-config.js';

export type { CommandResponse } from './model/command-response.js';
export type { ActiveChargingProfile } from './model/active-charging-profile.js';
export type { ActiveChargingProfileResult } from './model/active-charging-profile-result.js';
export type { ClearChargingProfileResult } from './model/charging-profiles-clear-profile-result.js';
export type { ChargingProfileResponse } from './model/charging-profile-response.js';
export type { ChargingProfileResult } from './model/charging-profile-result.js';
export { ChargingProfileResultType } from './model/charging-profile-result.js';
export {
  generateMockForSchema,
  generateMockOcpiPaginatedResponse,
  BaseController,
} from './controllers/base-controller.js';
export {
  buildOcpiPaginatedResponse,
  DEFAULT_OFFSET,
  DEFAULT_LIMIT,
} from './model/paginated-response.js';
export { CommandType } from './model/command-type.js';
export type { CancelReservation } from './model/cancel-reservation.js';
export {
  CancelReservationSchema,
  CancelReservationSchemaName,
} from './model/cancel-reservation.js';
export type { ReserveNow } from './model/reserve-now.js';
export { ReserveNowSchema, ReserveNowSchemaName } from './model/reserve-now.js';
export type { SetChargingProfile } from './model/set-charging-profile.js';
export {
  SetChargingProfileSchema,
  SetChargingProfileSchemaName,
} from './model/set-charging-profile.js';
export type { StartSession } from './model/start-session.js';
export { StartSessionSchema, StartSessionSchemaName } from './model/start-session.js';
export type { StopSession } from './model/stop-session.js';
export { StopSessionSchema, StopSessionSchemaName } from './model/stop-session.js';
export type { UnlockConnector } from './model/unlock-connector.js';
export { UnlockConnectorSchema, UnlockConnectorSchemaName } from './model/unlock-connector.js';
export type { OcpiCommandResponse } from './model/command-response.js';
export { ModuleId } from './model/module-id.js';
export type { CredentialsResponse } from './model/credentials-response.js';
export {
  CredentialsResponseSchema,
  CredentialsResponseSchemaName,
  buildCredentialsResponse,
} from './model/credentials-response.js';
export type { OcpiEmptyResponse } from './model/ocpi-empty-response.js';
export {
  OcpiEmptyResponseSchema,
  OcpiEmptyResponseSchemaName,
  buildOcpiEmptyResponse,
} from './model/ocpi-empty-response.js';
export type { OcpiStringResponse } from './model/ocpi-string-response.js';
export { VersionNumber } from './model/version-number.js';
export type { VersionDetailsResponseDTO } from './model/dto/version-details-response-dto.js';
export type { VersionListResponseDTO } from './model/dto/version-list-response-dto.js';
export {
  VersionListResponseDTOSchema,
  VersionListResponseDTOSchemaName,
} from './model/dto/version-list-response-dto.js';
export { TokenType, TokenTypeSchema, TokenTypeSchemaName } from './model/token-type.js';
export { WhitelistType } from './model/whitelist-type.js';
export type { VersionDetailsDTO } from './model/dto/version-details-dto.js';
export type { VersionDTO } from './model/dto/version-dto.js';
export {
  OcpiResponseSchema,
  OcpiResponseStatusCode,
  buildOcpiResponse,
} from './model/ocpi-response.js';
export { OcpiModule } from './model/ocpi-module.js';
export { CommandResultType } from './model/command-result.js';
export { EnumQueryParam } from './util/decorators/enum-query-param.js';
export type { CommandResult } from './model/command-result.js';
export type {
  LocationDTO,
  LocationResponse,
  PaginatedLocationResponse,
} from './model/dto/location-dto.js';
export {
  LocationResponseSchema,
  LocationResponseSchemaName,
  PaginatedLocationResponseSchema,
  PaginatedLocationResponseSchemaName,
} from './model/dto/location-dto.js';
export type { EvseDTO, EvseResponse } from './model/dto/evse-dto.js';
export {
  UID_FORMAT,
  EXTRACT_EVSE_ID,
  EXTRACT_STATION_ID,
  EvseResponseSchema,
  EvseResponseSchemaName,
} from './model/dto/evse-dto.js';
export type { ConnectorDTO, ConnectorResponse } from './model/dto/connector-dto.js';
export {
  TEMPORARY_CONNECTOR_ID,
  ConnectorResponseSchema,
  ConnectorResponseSchemaName,
} from './model/dto/connector-dto.js';
export { LocationMapper } from './mapper/location-mapper.js';
export { TokensMapper } from './mapper/tokens-mapper.js';
export { SessionMapper } from './mapper/session-mapper.js';
export { AsOcpiFunctionalEndpoint } from './util/decorators/as-ocpi-functional-endpoint.js';
export { MultipleTypes } from './util/decorators/multiple-types.js';
export { OcpiNamespace } from './util/ocpi-namespace.js';
export { AsOcpiRegistrationEndpoint } from './util/decorators/as-ocpi-registration-endpoint.js';
export { OcpiHeaders } from './model/ocpi-headers.js';
export { AuthToken } from './util/decorators/auth-token.js';
export { VersionNumberParam } from './util/decorators/version-number-param.js';
export { EnumParam } from './util/decorators/enum-param.js';
export { OcpiExceptionHandler } from './util/middleware/ocpi-exception-handler.js';
export { AuthMiddleware, RegistrationAuthMiddleware } from './util/middleware/auth-middleware.js';
export { InvalidParamException } from './exception/invalid-param-exception.js';
export { MissingParamException } from './exception/missing-param-exception.js';
export { UnknownTokenException } from './exception/unknown-token-exception.js';
export { WrongClientAccessException } from './exception/wrong-client-access-exception.js';
export { ChargingProfilesService } from './services/charging-profiles-service.js';
// export { AsyncResponder } from './util/async-responder.js';
export { AsAdminEndpoint } from './util/decorators/as-admin-endpoint.js';

export { CacheWrapper } from './util/cache-wrapper.js';
export { ResponseGenerator } from './util/response-generator.js';
export { versionIdParam } from './util/decorators/version-number-param.js';
export type { PutChargingProfileParams } from './trigger/param/charging-profiles/put-charging-profile-params.js';
export { buildPutChargingProfileParams } from './trigger/param/charging-profiles/put-charging-profile-params.js';

export {
  AUTH_CONTROLLER_COMPONENT,
  EVSE_COMPONENT,
  CONNECTOR_COMPONENT,
  TOKEN_READER_COMPONENT,
  AVAILABILITY_STATE_VARIABLE,
  UNKNOWN_ID,
  NOT_APPLICABLE,
  CREATE,
  UPDATE,
} from './util/consts.js';

export { ResponseSchema, OpenAPI } from './openapi-spec-helper/decorators.js';
export { BaseClientApi } from './trigger/base-client-api.js';
export { LocationsClientApi } from './trigger/locations-client-api.js';

export { CommandsService } from './services/commands-service.js';
export { CredentialsService } from './services/credentials-service.js';
export { TokensService } from './services/tokens-service.js';
// export { TokensAdminService } from './services/tokens-admin-service.js';
export { LocationsService } from './services/locations-service.js';
export { VersionService } from './services/version-service.js';
export { SessionsService } from './services/sessions-service.js';
// export { AdminLocationsService } from './services/admin-locations-service.js';

// Export AsyncJob types
export type {
  AsyncJobStatusResponse,
  AsyncJobRequest,
  AsyncJobPaginatedParams,
} from './types/async-job-types.js';
export { AsyncJobAction, AsyncJobName } from './types/async-job-types.js';

export { TariffsService } from './services/tariffs-service.js';
export { TariffMapper } from './mapper/tariff-mapper.js';

export { OcpiHttpHeader } from './util/ocpi-http-header.js';

export { CdrsService } from './services/cdrs-service.js';
export type { PaginatedCdrResponse } from './model/cdr.js';
export { BaseBroadcaster } from './broadcaster/base-broadcaster.js';
export type { PaginatedTariffResponse, TariffDTO } from './model/dto/tariffs/tariff-dto.js';
export {
  PaginatedTariffResponseSchema,
  PaginatedTariffResponseSchemaName,
} from './model/dto/tariffs/tariff-dto.js';
export { BodyWithExample } from './util/decorators/body-with-example.js';
export { CommandExecutor } from './util/command-executor.js';
export type { PutTariffRequest } from './model/dto/tariffs/put-tariff-request.js';
export {
  PutTariffRequestSchema,
  PutTariffRequestSchemaName,
} from './model/dto/tariffs/put-tariff-request.js';
export type {
  AdminLocationDTO,
  AdminEvseDTO,
  AdminConnectorDTO,
} from './model/dto/admin/admin-location-dto.js';
export {
  ChargingStationVariableAttributes,
  CONSTRUCT_CHARGING_STATION_VARIABLE_ATTRIBUTES_QUERY,
} from './model/variable-attributes/charging-station-variable-attributes.js';
export {
  EvseVariableAttributes,
  CONSTRUCT_EVSE_VARIABLE_ATTRIBUTES_QUERY,
} from './model/variable-attributes/evse-variable-attributes.js';
export {
  ConnectorVariableAttributes,
  CONSTRUCT_CONNECTOR_VARIABLE_ATTRIBUTES_QUERY,
} from './model/variable-attributes/connector-variable-attributes.js';
export type { UnregisterClientRequestDTO } from './model/unregister-client-request-dto.js';
export {
  UnregisterClientRequestDTOSchema,
  UnregisterClientRequestDTOSchemaName,
} from './model/unregister-client-request-dto.js';
export * from './events/index.js';

export { getDtoEventHandlerMetaData } from './events/as-dto-event-handler.js';
export { LocationsBroadcaster } from './broadcaster/locations-broadcaster.js';

export class OcpiServer extends KoaServer {
  private readonly ocpiConfig: OcpiConfig;
  private readonly container: AwilixContainer;
  private _modules: (OcpiModule | IDtoModule)[] = [];
  get modules(): (OcpiModule | IDtoModule)[] {
    return this._modules;
  }

  private readonly moduleList: OcpiModuleToken[];

  constructor(ocpiConfig: OcpiConfig, container: AwilixContainer, moduleList: OcpiModuleToken[]) {
    super();

    this.ocpiConfig = ocpiConfig;
    this.container = container;
    this.moduleList = moduleList;
  }

  public async initialize() {
    for (const moduleToken of this.moduleList) {
      const constructedModule = this.container.resolve<OcpiModule & IDtoModule>(moduleToken);
      if (constructedModule.init) {
        await constructedModule.init();
      }
      if (constructedModule.initHandlers) {
        await constructedModule.initHandlers();
      }
      this._modules.push(constructedModule);
    }
    this.initKoaServer();
  }

  private initKoaServer() {
    try {
      this.koa = new Koa();
      const controllers = this._modules.map((module) => (module as OcpiModule).getController());
      const options: RoutingControllersOptions = {
        controllers: [...controllers, HealthController],
        routePrefix: '/ocpi',
        middlewares: [],
        defaultErrorHandler: false,
      } as RoutingControllersOptions;
      this.initApp(options);

      this.initKoaSwagger(
        {
          title: 'CitrineOS OCPI 2.2.1',
          version: packageJson.default.version,
        },
        [
          {
            url: '/ocpi',
          },
        ],
      );
      this.run(this.ocpiConfig.ocpiServer.host, this.ocpiConfig.ocpiServer.port);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
}

export { CommandResponseSchema, CommandResponseSchemaName } from './model/command-response.js';
export { ChargingProfileResponseSchemaName } from './model/charging-profile-response.js';
export { ChargingProfileResponseSchema } from './model/charging-profile-response.js';

export { PaginatedCdrResponseSchema, PaginatedCdrResponseSchemaName } from './model/cdr.js';

// OCPI modules (folded in from the former 03_Modules/* packages).
// Must remain the last export so foundational symbols (OcpiModule,
// AbstractDtoModule, decorators, ...) are initialized before the module
// classes that extend/decorate them evaluate within the import cycle.
export * from './modules/index.js';

export { buildOcpiContainer, type OcpiModuleToken, type OcpiPrebuilt } from './container.js';
export type {
  OcpiClientApiDependencies,
  OcpiConfiguredDependencies,
  OcpiDependencies,
  OcpiGraphqlDependencies,
  OcpiModuleDependencies,
} from './dependencies.js';
