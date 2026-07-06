// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Base Library Interfaces
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export { AbstractModuleApi } from './src/interfaces/api/AbstractModuleApi.js';
export { AsDataEndpoint } from './src/interfaces/api/AsDataEndpoint.js';
export { AsMessageEndpoint } from './src/interfaces/api/AsMessageEndpoint.js';
export { ApiAuthenticationResult } from './src/interfaces/api/auth/ApiAuthenticationResult.js';
export { ApiAuthorizationResult } from './src/interfaces/api/auth/ApiAuthorizationResult.js';
export type { IApiAuthProvider } from './src/interfaces/api/auth/IApiAuthProvider.js';
export type { UserInfo } from './src/interfaces/api/auth/UserInfo.js';
export { BadRequestError } from './src/interfaces/api/exceptions/BadRequestError.js';
export { NotFoundError } from './src/interfaces/api/exceptions/NotFoundError.js';
export { HttpMethod } from './src/interfaces/api/HttpMethods.js';
export type { IModuleApi } from './src/interfaces/api/ModuleApi.js';
export type { IAuthorizer } from './src/interfaces/authorizer/index.js';
export type { IVatProvider } from './src/interfaces/vat/index.js';
export type { ICache } from './src/interfaces/cache/cache.js';
export {
  CacheNamespace,
  createIdentifier,
  getCacheTenantPathMappingKey,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
} from './src/interfaces/cache/types.js';
export type { IWebsocketConnection } from './src/interfaces/cache/types.js';
export type { IFileAccess } from './src/interfaces/files/fileAccess.js';
export type { IFileStorage } from './src/interfaces/files/fileStorage.js';
export {
  AbstractConnectionManager,
  AbstractMessageHandler,
  AbstractMessageSender,
  EventGroup,
  eventGroupFromString,
  Message,
  MessageOrigin,
  MessageState,
  RetryMessageError,
} from './src/interfaces/messages/index.js';
export type {
  HandlerProperties,
  IConnectionManager,
  IMessage,
  IMessageConfirmation,
  IMessageContext,
  IMessageHandler,
  IMessageSender,
} from './src/interfaces/messages/index.js';
export { AbstractModule } from './src/interfaces/modules/AbstractModule.js';
export type { OcppModuleDependencies } from './src/interfaces/modules/AbstractModule.js';
export { AsHandler } from './src/interfaces/modules/AsHandler.js';
export type { IModule } from './src/interfaces/modules/Module.js';
export { OCPPValidator } from './src/interfaces/modules/OCPPValidator.js';
export { AbstractMessageRouter } from './src/interfaces/router/AbstractRouter.js';
export type { AuthenticationOptions } from './src/interfaces/router/AuthenticationOptions.js';
export type { IAuthenticator } from './src/interfaces/router/Authenticator.js';
export type { INetworkConnection } from './src/interfaces/router/INetworkConnection.js';
export type { IMessageRouter } from './src/interfaces/router/Router.js';
export {
  ErrorCode,
  mapToCallAction,
  MessageTypeId,
  NO_ACTION,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OcppError,
  OCPPVersion,
} from './src/ocpp/rpc/message.js';
export type {
  Call,
  CallAction,
  CallError,
  CallResult,
  OCPPVersionType,
} from './src/ocpp/rpc/message.js';

// Persistence Interfaces

export { CrudRepository } from './src/interfaces/repository.js';
export type { CrudEvent } from './src/interfaces/repository.js';
export { TenantContextManager } from './src/interfaces/tenant.js';
export * from './src/ocpp/persistence/index.js';

// Configuration Types

export { BOOT_STATUS } from './src/config/BootConfig.js';
export type { BootConfig } from './src/config/BootConfig.js';
export { loadBootstrapConfig } from './src/config/bootstrap.config.js';
export type { BootstrapConfig } from './src/config/bootstrap.config.js';
export { ConfigStoreFactory } from './src/config/ConfigStore.js';
export type { ConfigStore } from './src/config/ConfigStore.js';
export { DEFAULT_TENANT_ID, defineConfig } from './src/config/defineConfig.js';
export {
  HUBJECT_DEFAULT_BASEURL,
  HUBJECT_DEFAULT_CLIENTID,
  HUBJECT_DEFAULT_CLIENTSECRET,
  HUBJECT_DEFAULT_TOKENURL,
  OCPP_VERSION_LIST,
  RbacRulesSchema,
  systemConfigInputSchema,
  systemConfigSchema,
} from './src/config/types.js';
export type { RbacRules, SystemConfig, WebsocketServerConfig } from './src/config/types.js';

// Utils

export { MeterValueUtils } from './src/util/MeterValueUtils.js';
export { RequestBuilder } from './src/util/request.js';

export const LOG_LEVEL_OCPP = 10;

// OCPP 2.0.1 Interfaces

export * from './src/ocpp/model/index.js';

export type { UpdateChargingStationPasswordRequest } from './src/ocpp/model/UpdateChargingStationPasswordRequest.js';

export interface OcppRequest {}

export interface OcppResponse {}

export {
  OCPP1_6_CALL_RESULT_SCHEMA_RECORD,
  OCPP1_6_CALL_SCHEMA_RECORD,
  OCPP2_0_1_CALL_RESULT_SCHEMA_RECORD,
  OCPP2_0_1_CALL_SCHEMA_RECORD,
  OCPP2_1_CALL_RESULT_SCHEMA_RECORD,
  OCPP2_1_CALL_SCHEMA_RECORD,
} from './src/interfaces/schema/MappingSchema.js';

export { assert, deepDirectionalEqual, notNull } from './src/assertion/assertion.js';
export { AuthorizationSecurity } from './src/interfaces/api/AuthorizationSecurity.js';
export { UnauthorizedError } from './src/interfaces/api/exception/UnauthorizedError.js';
export { UnauthorizedException } from './src/interfaces/api/exceptions/unauthorized.exception.js';
export { HttpHeader } from './src/interfaces/api/http.header.js';
export { HttpStatus } from './src/interfaces/api/http.status.js';
export * from './src/interfaces/dto/async.job.dto.js';
export * from './src/interfaces/dto/authorization.dto.js';
export * from './src/interfaces/dto/boot.dto.js';
export * from './src/interfaces/dto/certificate.dto.js';
export * from './src/interfaces/dto/change.configuration.dto.js';
export * from './src/interfaces/dto/charging.needs.dto.js';
export * from './src/interfaces/dto/charging.profile.dto.js';
export * from './src/interfaces/dto/charging.schedule.dto.js';
export * from './src/interfaces/dto/charging.station.dto.js';
export * from './src/interfaces/dto/charging.station.network.profile.dto.js';
export * from './src/interfaces/dto/charging.station.security.info.dto.js';
export * from './src/interfaces/dto/charging.station.sequence.dto.js';
export * from './src/interfaces/dto/component.dto.js';
export * from './src/interfaces/dto/composite.schedule.dto.js';
export * from './src/interfaces/dto/connector.dto.js';
export * from './src/interfaces/dto/event.data.dto.js';
export * from './src/interfaces/dto/evse.dto.js';
export * from './src/interfaces/dto/evse.type.dto.js';
export * from './src/interfaces/dto/installed.certificate.dto.js';
export * from './src/interfaces/dto/latest.status.notification.dto.js';
export * from './src/interfaces/dto/local.list.authorization.dto.js';
export * from './src/interfaces/dto/local.list.version.dto.js';
export * from './src/interfaces/dto/location.dto.js';
export * from './src/interfaces/dto/message.info.dto.js';
export * from './src/interfaces/dto/meter.value.dto.js';
export * from './src/interfaces/dto/ocpp.message.dto.js';
export * from './src/interfaces/dto/reservation.dto.js';
export * from './src/interfaces/dto/sales.tariff.dto.js';
export * from './src/interfaces/dto/security.event.dto.js';
export * from './src/interfaces/dto/send.list.dto.js';
export * from './src/interfaces/dto/server.network.profile.dto.js';
export * from './src/interfaces/dto/set.network.profile.dto.js';
export * from './src/interfaces/dto/start.transaction.dto.js';
export * from './src/interfaces/dto/status.notification.dto.js';
export * from './src/interfaces/dto/stop.transaction.dto.js';
export * from './src/interfaces/dto/subscription.dto.js';
export * from './src/interfaces/dto/tariff.dto.js';
export * from './src/interfaces/dto/tenant.dto.js';
export * from './src/interfaces/dto/tenant.partner.dto.js';
export * from './src/interfaces/dto/transaction.dto.js';
export * from './src/interfaces/dto/transaction.event.dto.js';
export * from './src/interfaces/dto/types/authorization.js';
export * from './src/interfaces/dto/types/base.dto.js';
export * from './src/interfaces/dto/types/charging.parameters.js';
export * from './src/interfaces/dto/types/enums.js';
export * from './src/interfaces/dto/types/hours.js';
export * from './src/interfaces/dto/types/location.js';
export * from './src/interfaces/dto/types/message.info.js';
export * from './src/interfaces/dto/types/ocpi.registration.js';
export * from './src/interfaces/dto/types/sales.tariff.js';
export * from './src/interfaces/dto/types/sampled.value.dto.js';
export * from './src/interfaces/dto/types/transaction.type.js';
export * from './src/interfaces/dto/types/tariff.types.js';
export * from './src/interfaces/dto/types/vat.js';
export * from './src/interfaces/dto/variable.attribute.dto.js';
export * from './src/interfaces/dto/variable.characteristics.dto.js';
export * from './src/interfaces/dto/variable.dto.js';
export * from './src/interfaces/dto/variable.monitoring.dto.js';
export * from './src/interfaces/dto/variable.monitoring.status.dto.js';
export * from './src/interfaces/dto/variable.status.dto.js';

export { Currency } from './src/money/Currency.js';
export type { CurrencyCode } from './src/money/Currency.js';
export { Money } from './src/money/Money.js';
export { addFormats, Ajv };
export declare type Constructable<T> = new (...args: any[]) => T;
export { IMessageQuerystringSchema } from './src/interfaces/api/MessageQuerystring.js';
export type { IMessageQuerystring } from './src/interfaces/api/MessageQuerystring.js';

export * as OCPP2_request_types from './src/ocpp/rpc/2/requests.js';
export * as OCPP2_response_types from './src/ocpp/rpc/2/responses.js';
export { getOcpp2Schema } from './src/ocpp/rpc/2/schemas.js';
export * as OCPP2_common_types from './src/ocpp/rpc/2/types.js';
