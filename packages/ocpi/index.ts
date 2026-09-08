// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export * from './src/services/broadcaster/index.js';
export * from './src/mappers/index.js';
export * from './src/transport/graphql/index.js';
export type { Version } from './src/types/version.js';
export { BodyWithSchema } from './src/apis/decorators/body-with-schema.js';
export { plainToClass } from './src/util/util.js';
export { OcpiErrorResponse, buildOcpiErrorResponse } from './src/types/ocpi-error-response.js';
export type {
  AuthorizationInfo,
  AuthorizationInfoResponse,
} from './src/types/authorization-info.js';
export { TokensClientApi } from './src/transport/trigger/tokens-client-api.js';
export { AuthorizationInfoAllowed } from './src/types/authorization-info-allowed.js';
export type { PostTokenParams } from './src/transport/trigger/param/tokens/post-token-params.js';
export { UnsuccessfulRequestException } from './src/apis/exception/unsuccessful-request-exception.js';
export { NotFoundException } from './src/apis/exception/not-found-exception.js';
export { FunctionalEndpointParams } from './src/apis/decorators/function-endpoint-params.js';
export type { PaginatedOcpiParams } from './src/transport/trigger/param/paginated-ocpi-params.js';
export type { OcpiParams } from './src/transport/trigger/util/ocpi-params.js';
export type { ChargingPreferences } from './src/types/charging-preferences.js';
export {
  ChargingPreferencesSchema,
  ChargingPreferencesSchemaName,
} from './src/types/charging-preferences.js';
export { PaginatedParams } from './src/apis/controllers/param/paginated-params.js';
export { Paginated } from './src/apis/decorators/paginated.js';
export {
  OCPPCommandHandler,
  OCPP1_6_CommandHandler,
  OCPP2_0_1_CommandHandler,
  OCPP2_1_CommandHandler,
} from './src/util/ocpp-command-handlers/index.js';
export type { OcppCommandHandlerDependencies } from './src/util/ocpp-command-handlers/index.js';
export type { ChargingPreferencesResponse } from './src/types/charging-preferences-response.js';
export {
  ChargingPreferencesResponseSchema,
  ChargingPreferencesResponseSchemaName,
} from './src/types/charging-preferences-response.js';
export type { PaginatedSessionResponse, Session } from './src/types/session.js';
export {
  PaginatedSessionResponseSchema,
  PaginatedSessionResponseSchemaName,
} from './src/types/session.js';
export { Role } from './src/types/role.js';
export { ImageCategory } from './src/types/image-category.js';
export { ImageType } from './src/types/image-type.js';
export { CountryCode } from './src/util/util.js';
export { KoaServer } from './src/server/koa-server.js';
export { InterfaceRole } from './src/types/interface-role.js';
export { AlreadyRegisteredException } from './src/apis/exception/already-registered-exception.js';
export { NotRegisteredException } from './src/apis/exception/not-registered-exception.js';
export { VersionsClientApi } from './src/transport/trigger/versions-client-api.js';
// export { ChargingProfilesClientApi } from './trigger/charging-profiles-client-api';
export type { CredentialsDTO } from './src/types/dto/credentials-dto.js';
export { CredentialsDTOSchema, CredentialsDTOSchemaName } from './src/types/dto/credentials-dto.js';
export type { AdminCredentialsRequestDTO } from './src/types/dto/admin-credentials-request-dto.js';
export {
  AdminCredentialsRequestDTOSchema,
  AdminCredentialsRequestDTOSchemaName,
} from './src/types/dto/admin-credentials-request-dto.js';
export type { SingleTokenRequest, TokenDTO, TokenResponse } from './src/types/dto/token-dto.js';
export {
  SingleTokenRequestSchema,
  TokenDTOSchema,
  TokenResponseSchema,
  TokenResponseSchemaName,
  TokenDTOSchemaName,
} from './src/types/dto/token-dto.js';

export type { OcpiConfig, OcpiConfigInput } from './src/config/ocpi-types.js';
export { defineOcpiConfig } from './src/config/define-ocpi-config.js';
export { getOcpiSystemConfig } from './src/config/loader.js';
export type { ServerConfig } from './src/config/server-config.js';
export { Env } from './src/config/server-config.js';

export type { CommandResponse } from './src/types/command-response.js';
export type { ActiveChargingProfile } from './src/types/active-charging-profile.js';
export type { ActiveChargingProfileResult } from './src/types/active-charging-profile-result.js';
export type { ClearChargingProfileResult } from './src/types/charging-profiles-clear-profile-result.js';
export type { ChargingProfileResponse } from './src/types/charging-profile-response.js';
export type { ChargingProfileResult } from './src/types/charging-profile-result.js';
export { ChargingProfileResultType } from './src/types/charging-profile-result.js';
export {
  generateMockForSchema,
  generateMockOcpiPaginatedResponse,
  BaseController,
} from './src/apis/controllers/base-controller.js';
export {
  buildOcpiPaginatedResponse,
  DEFAULT_OFFSET,
  DEFAULT_LIMIT,
} from './src/types/paginated-response.js';
export { CommandType } from './src/types/command-type.js';
export type { CancelReservation } from './src/types/cancel-reservation.js';
export {
  CancelReservationSchema,
  CancelReservationSchemaName,
} from './src/types/cancel-reservation.js';
export type { ReserveNow } from './src/types/reserve-now.js';
export { ReserveNowSchema, ReserveNowSchemaName } from './src/types/reserve-now.js';
export type { SetChargingProfile } from './src/types/set-charging-profile.js';
export {
  SetChargingProfileSchema,
  SetChargingProfileSchemaName,
} from './src/types/set-charging-profile.js';
export type { StartSession } from './src/types/start-session.js';
export { StartSessionSchema, StartSessionSchemaName } from './src/types/start-session.js';
export type { StopSession } from './src/types/stop-session.js';
export { StopSessionSchema, StopSessionSchemaName } from './src/types/stop-session.js';
export type { UnlockConnector } from './src/types/unlock-connector.js';
export { UnlockConnectorSchema, UnlockConnectorSchemaName } from './src/types/unlock-connector.js';
export type { OcpiCommandResponse } from './src/types/command-response.js';
export { ModuleId } from './src/types/module-id.js';
export type { CredentialsResponse } from './src/types/credentials-response.js';
export {
  CredentialsResponseSchema,
  CredentialsResponseSchemaName,
  buildCredentialsResponse,
} from './src/types/credentials-response.js';
export type { OcpiEmptyResponse } from './src/types/ocpi-empty-response.js';
export {
  OcpiEmptyResponseSchema,
  OcpiEmptyResponseSchemaName,
  buildOcpiEmptyResponse,
} from './src/types/ocpi-empty-response.js';
export type { OcpiStringResponse } from './src/types/ocpi-string-response.js';
export { VersionNumber } from './src/types/version-number.js';
export type { VersionDetailsResponseDTO } from './src/types/dto/version-details-response-dto.js';
export type { VersionListResponseDTO } from './src/types/dto/version-list-response-dto.js';
export {
  VersionListResponseDTOSchema,
  VersionListResponseDTOSchemaName,
} from './src/types/dto/version-list-response-dto.js';
export { TokenType, TokenTypeSchema, TokenTypeSchemaName } from './src/types/token-type.js';
export { WhitelistType } from './src/types/whitelist-type.js';
export type { VersionDetailsDTO } from './src/types/dto/version-details-dto.js';
export type { VersionDTO } from './src/types/dto/version-dto.js';
export {
  OcpiResponseSchema,
  OcpiResponseStatusCode,
  buildOcpiResponse,
} from './src/types/ocpi-response.js';
export { OcpiModule } from './src/types/ocpi-module.js';
export { CommandResultType } from './src/types/command-result.js';
export { EnumQueryParam } from './src/apis/decorators/enum-query-param.js';
export type { CommandResult } from './src/types/command-result.js';
export type {
  LocationDTO,
  LocationResponse,
  PaginatedLocationResponse,
} from './src/types/dto/location-dto.js';
export {
  LocationResponseSchema,
  LocationResponseSchemaName,
  PaginatedLocationResponseSchema,
  PaginatedLocationResponseSchemaName,
} from './src/types/dto/location-dto.js';
export type { EvseDTO, EvseResponse } from './src/types/dto/evse-dto.js';
export {
  UID_FORMAT,
  EXTRACT_EVSE_ID,
  EXTRACT_STATION_ID,
  EvseResponseSchema,
  EvseResponseSchemaName,
} from './src/types/dto/evse-dto.js';
export type { ConnectorDTO, ConnectorResponse } from './src/types/dto/connector-dto.js';
export {
  TEMPORARY_CONNECTOR_ID,
  ConnectorResponseSchema,
  ConnectorResponseSchemaName,
} from './src/types/dto/connector-dto.js';
export { LocationMapper } from './src/mappers/location-mapper.js';
export { TokensMapper } from './src/mappers/tokens-mapper.js';
export { SessionMapper } from './src/mappers/session-mapper.js';
export { AsOcpiFunctionalEndpoint } from './src/apis/decorators/as-ocpi-functional-endpoint.js';
export { MultipleTypes } from './src/apis/decorators/multiple-types.js';
export { OcpiNamespace } from './src/util/ocpi-namespace.js';
export { AsOcpiRegistrationEndpoint } from './src/apis/decorators/as-ocpi-registration-endpoint.js';
export { OcpiHeaders } from './src/types/ocpi-headers.js';
export { AuthToken } from './src/apis/decorators/auth-token.js';
export { VersionNumberParam } from './src/apis/decorators/version-number-param.js';
export { EnumParam } from './src/apis/decorators/enum-param.js';
export { OcpiExceptionHandler } from './src/apis/middleware/ocpi-exception-handler.js';
export {
  AuthMiddleware,
  RegistrationAuthMiddleware,
} from './src/apis/middleware/auth-middleware.js';
export { InvalidParamException } from './src/apis/exception/invalid-param-exception.js';
export { MissingParamException } from './src/apis/exception/missing-param-exception.js';
export { UnknownTokenException } from './src/apis/exception/unknown-token-exception.js';
export { WrongClientAccessException } from './src/apis/exception/wrong-client-access-exception.js';
export { ChargingProfilesService } from './src/services/charging-profiles-service.js';
// export { AsyncResponder } from './src/services/async-responder.js';
export { AsAdminEndpoint } from './src/apis/decorators/as-admin-endpoint.js';

export { CacheWrapper } from './src/services/cache-wrapper.js';
export { ResponseGenerator } from './src/services/response-generator.js';
export { versionIdParam } from './src/apis/decorators/version-number-param.js';
export type { PutChargingProfileParams } from './src/transport/trigger/param/charging-profiles/put-charging-profile-params.js';
export { buildPutChargingProfileParams } from './src/transport/trigger/param/charging-profiles/put-charging-profile-params.js';

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
} from './src/util/consts.js';

export { ResponseSchema, OpenAPI } from './src/apis/openapi-spec-helper/decorators.js';
export { BaseClientApi } from './src/transport/trigger/base-client-api.js';
export { LocationsClientApi } from './src/transport/trigger/locations-client-api.js';

export { CommandsService } from './src/services/commands-service.js';
export { CredentialsService } from './src/services/credentials-service.js';
export { TokensService } from './src/services/tokens-service.js';
// export { TokensAdminService } from './src/services/tokens-admin-service.js';
export { LocationsService } from './src/services/locations-service.js';
export { VersionService } from './src/services/version-service.js';
export { SessionsService } from './src/services/sessions-service.js';
// export { AdminLocationsService } from './src/services/admin-locations-service.js';

// Export AsyncJob types
export type {
  AsyncJobStatusResponse,
  AsyncJobRequest,
  AsyncJobPaginatedParams,
} from './src/types/async-job-types.js';
export { AsyncJobAction, AsyncJobName } from './src/types/async-job-types.js';

export { TariffsService } from './src/services/tariffs-service.js';
export { TariffMapper } from './src/mappers/tariff-mapper.js';

export { OcpiHttpHeader } from './src/util/ocpi-http-header.js';

export { CdrsService } from './src/services/cdrs-service.js';
export type { PaginatedCdrResponse } from './src/types/cdr.js';
export { BaseBroadcaster } from './src/services/broadcaster/base-broadcaster.js';
export type { PaginatedTariffResponse, TariffDTO } from './src/types/dto/tariffs/tariff-dto.js';
export {
  PaginatedTariffResponseSchema,
  PaginatedTariffResponseSchemaName,
} from './src/types/dto/tariffs/tariff-dto.js';
export { BodyWithExample } from './src/apis/decorators/body-with-example.js';
export { CommandExecutor } from './src/services/command-executor.js';
export type { PutTariffRequest } from './src/types/dto/tariffs/put-tariff-request.js';
export {
  PutTariffRequestSchema,
  PutTariffRequestSchemaName,
} from './src/types/dto/tariffs/put-tariff-request.js';
export type {
  AdminLocationDTO,
  AdminEvseDTO,
  AdminConnectorDTO,
} from './src/types/dto/admin/admin-location-dto.js';
export {
  ChargingStationVariableAttributes,
  CONSTRUCT_CHARGING_STATION_VARIABLE_ATTRIBUTES_QUERY,
} from './src/types/variable-attributes/charging-station-variable-attributes.js';
export {
  EvseVariableAttributes,
  CONSTRUCT_EVSE_VARIABLE_ATTRIBUTES_QUERY,
} from './src/types/variable-attributes/evse-variable-attributes.js';
export {
  ConnectorVariableAttributes,
  CONSTRUCT_CONNECTOR_VARIABLE_ATTRIBUTES_QUERY,
} from './src/types/variable-attributes/connector-variable-attributes.js';
export type { UnregisterClientRequestDTO } from './src/types/unregister-client-request-dto.js';
export {
  UnregisterClientRequestDTOSchema,
  UnregisterClientRequestDTOSchemaName,
} from './src/types/unregister-client-request-dto.js';
export * from './src/handlers/index.js';

export { getDtoEventHandlerMetaData } from './src/handlers/as-dto-event-handler.js';
export { LocationsBroadcaster } from './src/services/broadcaster/locations-broadcaster.js';

export { CommandResponseSchema, CommandResponseSchemaName } from './src/types/command-response.js';
export { ChargingProfileResponseSchemaName } from './src/types/charging-profile-response.js';
export { ChargingProfileResponseSchema } from './src/types/charging-profile-response.js';

export { PaginatedCdrResponseSchema, PaginatedCdrResponseSchemaName } from './src/types/cdr.js';

// OCPI modules (folded in from the former 03_Modules/* packages).
// Must remain the last export so foundational symbols (OcpiModule,
// AbstractDtoModule, decorators, ...) are initialized before the module
// classes that extend/decorate them evaluate within the import cycle.
export * from './src/modules/index.js';

export {
  buildOcpiContainer,
  type OcpiModuleToken,
  type OcpiPrebuilt,
} from './src/server/container.js';
export type {
  OcpiClientApiDependencies,
  OcpiConfiguredDependencies,
  OcpiDependencies,
  OcpiGraphqlDependencies,
  OcpiModuleDependencies,
} from './src/server/dependencies.js';
export { OcpiServer } from './src/server/ocpi-server.js';
