// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Base Library Interfaces
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export { ApiAuthenticationResult } from './src/interfaces/api/auth/api-authentication-result.js';
export { ApiAuthorizationResult } from './src/interfaces/api/auth/api-authorization-result.js';
export type { IApiAuthProvider } from './src/interfaces/api/auth/i-api-auth-provider.js';
export type { UserInfo } from './src/interfaces/api/auth/user-info.js';
export { AbstractEndpoint } from './src/interfaces/api/endpoints/abstract-endpoint.js';
export type { AbstractEndpointDependencies } from './src/interfaces/api/endpoints/abstract-endpoint.js';
export { AbstractEndpointApi } from './src/interfaces/api/endpoints/abstract-endpoint-api.js';
export { AbstractMessageEndpoint } from './src/interfaces/api/endpoints/abstract-message-endpoint.js';
export type {
  AbstractMessageEndpointDependencies,
  IMessageEndpointMetadata,
} from './src/interfaces/api/endpoints/abstract-message-endpoint.js';
export { AbstractMessageEndpointApi } from './src/interfaces/api/endpoints/abstract-message-endpoint-api.js';
export type {
  BuiltEndpoint,
  EndpointClass,
  EndpointResolverCradle,
  IEndpointBuilder,
} from './src/interfaces/api/endpoints/build-endpoints.js';
export type {
  BuiltMessageEndpoint,
  MessageEndpointClass,
} from './src/interfaces/api/endpoints/build-message-endpoints.js';
export type { ICommandEndpointMetadata } from './src/interfaces/api/endpoints/endpoint-metadata.js';
export { BadRequestError } from './src/interfaces/api/exceptions/bad-request-error.js';
export { NotFoundError } from './src/interfaces/api/exceptions/not-found-error.js';
export type { IAuthorizer } from './src/interfaces/authorizer/index.js';
export type { ICache } from './src/interfaces/cache/cache.js';
export { CacheNamespace } from './src/interfaces/cache/types.js';
export type { IWebsocketConnection } from './src/interfaces/cache/types.js';
export type { IFileAccess } from './src/interfaces/files/file-access.js';
export type {
  CreateDirectoryOptions,
  DeleteFileOptions,
  IFileStorage,
  TrustOptions,
} from './src/interfaces/files/file-storage.js';
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
export { AbstractModule } from './src/interfaces/modules/abstract-module.js';
export type { OcppModuleDependencies } from './src/interfaces/modules/abstract-module.js';
export type { IModule } from './src/interfaces/modules/module.js';
export { OCPPValidator } from './src/interfaces/modules/ocpp-validator.js';
export { AbstractMessageRouter } from './src/interfaces/router/abstract-router.js';
export type { AuthenticationOptions } from './src/interfaces/router/authentication-options.js';
export type { IAuthenticator } from './src/interfaces/router/authenticator.js';
export type { INetworkConnection } from './src/interfaces/router/i-network-connection.js';
export type { IMessageRouter } from './src/interfaces/router/router.js';
export type { IVatProvider } from './src/interfaces/vat/index.js';
export { buildEndpoints } from './src/util/endpoints/build-endpoints.js';
export { buildMessageEndpoints } from './src/util/endpoints/build-message-endpoints.js';
export { forwardMessageEndpoint } from './src/util/endpoints/forward-message-endpoint.js';

export {
  AbstractHandler,
  type AbstractHandlerDependencies,
} from './src/interfaces/handlers/abstract-handler.js';
export { AsRequestHandler, AsResponseHandler } from './src/interfaces/handlers/as-handler-class.js';
export { buildHandlers } from './src/interfaces/handlers/build-handlers.js';
export type {
  HandlerClass,
  HandlerResolverCradle,
  IHandlerBuilder,
} from './src/interfaces/handlers/build-handlers.js';
export type { IHandlerMetadata } from './src/interfaces/handlers/handler-metadata.js';
export type { IOcppSender } from './src/interfaces/handlers/i-ocpp-sender.js';
export { OcppSender } from './src/interfaces/handlers/ocpp-sender.js';

// Persistence Interfaces

export { CrudRepository } from './src/interfaces/repository.js';
export type { CrudEvent } from './src/interfaces/repository.js';
export { TenantContextManager } from './src/interfaces/tenant.js';
export * from './src/ocpp/persistence/index.js';

// Configuration Types

export { ConfigLoader } from './src/config/config-loader.js';

// Utils

export { recordAuthorizeResult } from './src/util/authorization-metrics.js';

export {
  assert,
  createIdentifier,
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
} from './src/interfaces/schema/mapping-schema.js';

export { AuthorizationSecurity } from './src/interfaces/api/authorization-security.js';
export { UnauthorizedError } from './src/interfaces/api/exception/unauthorized-error.js';
export { UnauthorizedException } from './src/interfaces/api/exceptions/unauthorized-exception.js';
export { HttpHeader } from './src/interfaces/api/http-header.js';
export { HttpStatus } from './src/interfaces/api/http-status.js';

export { Currency } from './src/money/currency.js';
export type { CurrencyCode } from './src/money/currency.js';
export type { Price } from './src/money/price.js';
export { PriceSchema } from './src/money/price.js';
export { Money } from './src/money/money.js';
export {
  baseCalculateFixedCost,
  baseCalculateEnergyCost,
  baseCalculateTimeCost,
  baseCalculateTotalCost,
} from './src/cost/cost-calculator.js';

export { addFormats, Ajv };
export declare type Constructable<T> = new (...args: any[]) => T;
export { IMessageQuerystringSchema } from './src/interfaces/api/message-querystring.js';
export type { IMessageQuerystring } from './src/interfaces/api/message-querystring.js';

export { getOcpp2Schema } from './src/ocpp/rpc/2/schemas.js';

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

// Constants

export { DEFAULT_TENANT_ID } from './src/util/identifiers.js';
