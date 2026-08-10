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
export type { IModuleApi } from './src/interfaces/api/ModuleApi.js';
export type { IAuthorizer } from './src/interfaces/authorizer/index.js';
export type { ICache } from './src/interfaces/cache/cache.js';
export { CacheNamespace } from './src/interfaces/cache/types.js';
export type { IWebsocketConnection } from './src/interfaces/cache/types.js';
export type { IFileAccess } from './src/interfaces/files/fileAccess.js';
export type {
  CreateDirectoryOptions,
  DeleteFileOptions,
  IFileStorage,
  TrustOptions,
} from './src/interfaces/files/fileStorage.js';
export {
  AbstractConnectionManager,
  AbstractMessageHandler,
  AbstractMessageSender,
  Message,
} from './src/interfaces/messages/index.js';
export type {
  IConnectionManager,
  IMessage,
  IMessageConfirmation,
  IMessageContext,
  IMessageHandler,
  IMessageSender,
} from './src/interfaces/messages/index.js';
export { AbstractModule } from './src/interfaces/modules/AbstractModule.js';
export type { OcppModuleDependencies } from './src/interfaces/modules/AbstractModule.js';
export type { IModule } from './src/interfaces/modules/Module.js';
export { OCPPValidator } from './src/interfaces/modules/OCPPValidator.js';
export { AbstractMessageRouter } from './src/interfaces/router/AbstractRouter.js';
export type { AuthenticationOptions } from './src/interfaces/router/AuthenticationOptions.js';
export type { IAuthenticator } from './src/interfaces/router/Authenticator.js';
export type { INetworkConnection } from './src/interfaces/router/INetworkConnection.js';
export type { IMessageRouter } from './src/interfaces/router/Router.js';
export type { IVatProvider } from './src/interfaces/vat/index.js';

export {
  AbstractHandler,
  type AbstractHandlerDependencies,
} from './src/interfaces/handlers/AbstractHandler.js';
export { AsRequestHandler, AsResponseHandler } from './src/interfaces/handlers/AsHandlerClass.js';
export { buildHandlers } from './src/interfaces/handlers/buildHandlers.js';
export type {
  HandlerClass,
  HandlerResolverCradle,
  IHandlerBuilder,
} from './src/interfaces/handlers/buildHandlers.js';
export type { IHandlerClassDefinition } from './src/interfaces/handlers/HandlerClassDefinition.js';
export type { IOcppSender } from './src/interfaces/handlers/IOcppSender.js';
export { OcppSender } from './src/interfaces/handlers/OcppSender.js';

// Persistence Interfaces

export { CrudRepository } from './src/interfaces/repository.js';
export type { CrudEvent } from './src/interfaces/repository.js';
export { TenantContextManager } from './src/interfaces/tenant.js';
export * from './src/ocpp/persistence/index.js';

// Configuration Types

// export { loadBootstrapConfig } from './src/config/bootstrap.config.js';
// export type { BootstrapConfig } from './src/config/bootstrap.config.js';
// export { ConfigStoreFactory } from './src/config/ConfigStore.js';
// export type { ConfigStore } from './src/config/ConfigStore.js';
// export { DEFAULT_TENANT_ID, defineConfig } from './src/config/defineConfig.js';
export { ConfigLoader } from './src/config/ConfigLoader.js';

// Utils

export { recordAuthorizeResult } from './src/util/AuthorizationMetrics.js';

export {
  assert,
  createIdentifier,
  getCacheTenantPathMappingKey,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
  MeterValueUtils,
  notNull,
  RequestBuilder,
} from './src/util/index.js';

export {
  OCPP1_6_CALL_RESULT_SCHEMA_RECORD,
  OCPP1_6_CALL_SCHEMA_RECORD,
  OCPP2_0_1_CALL_RESULT_SCHEMA_RECORD,
  OCPP2_0_1_CALL_SCHEMA_RECORD,
  OCPP2_1_CALL_RESULT_SCHEMA_RECORD,
  OCPP2_1_CALL_SCHEMA_RECORD,
} from './src/interfaces/schema/MappingSchema.js';

export { AuthorizationSecurity } from './src/interfaces/api/AuthorizationSecurity.js';
export { UnauthorizedError } from './src/interfaces/api/exception/UnauthorizedError.js';
export { UnauthorizedException } from './src/interfaces/api/exceptions/unauthorized.exception.js';
export { HttpHeader } from './src/interfaces/api/http.header.js';
export { HttpStatus } from './src/interfaces/api/http.status.js';

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

// OCPP RPC messages: the model objects wrapping the wire frames declared in
// @citrineos/types, plus the validation that turns one into the other.
export {
  Call,
  CallError,
  CallResult,
  mapToCallAction,
  OcppError,
  readMessageId,
  UNREADABLE_MESSAGE_ID,
} from './src/ocpp/rpc/message.js';
export type { RpcMessage } from './src/ocpp/rpc/message.js';
