// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export * from './repositories.js';

// Data endpoints query models
export { AuthorizationQuerySchema } from './queries/Authorization.js';
export type { AuthorizationQuerystring } from './queries/Authorization.js';
export { ChargingStationKeyQuerySchema } from './queries/ChargingStation.js';
export type { ChargingStationKeyQuerystring } from './queries/ChargingStation.js';
export { ConnectionDeleteQuerySchema } from './queries/Connection.js';
export type { ConnectionDeleteQuerystring } from './queries/Connection.js';
export { ModelKeyQuerystringSchema } from './queries/Model.js';
export type { ModelKeyQuerystring } from './queries/Model.js';
export {
  NetworkProfileDeleteQuerySchema,
  NetworkProfileQuerySchema,
} from './queries/NetworkProfile.js';
export type {
  NetworkProfileDeleteQuerystring,
  NetworkProfileQuerystring,
} from './queries/NetworkProfile.js';
export {
  GenerateCertificateChainSchema,
  InstallRootCertificateSchema,
} from './queries/RootCertificate.js';
export { CreateSubscriptionSchema } from './queries/Subscription.js';
export { TariffQuerySchema } from './queries/Tariff.js';
export type { TariffQueryString } from './queries/Tariff.js';
export { TenantQuerySchema, CreateTenantQuerySchema } from './queries/Tenant.js';
export type { TenantQueryString } from './queries/Tenant.js';
export { TlsCertificateSchema, UpdateTlsCertificateQuerySchema } from './queries/TlsCertificate.js';
export type { UpdateTlsCertificateQueryString } from './queries/TlsCertificate.js';
export { TransactionEventQuerySchema } from './queries/TransactionEvent.js';
export type { TransactionEventQuerystring } from './queries/TransactionEvent.js';
export { UpdateChargingStationPasswordQuerySchema } from './queries/UpdateChargingStationPasswordQuery.js';
export type { UpdateChargingStationPasswordQueryString } from './queries/UpdateChargingStationPasswordQuery.js';
export {
  CreateOrUpdateVariableAttributeQuerySchema,
  VariableAttributeQuerySchema,
} from './queries/VariableAttribute.js';
export type {
  CreateOrUpdateVariableAttributeQuerystring,
  VariableAttributeQuerystring,
} from './queries/VariableAttribute.js';
export {
  WebsocketDeleteQuerySchema,
  WebsocketGetQuerySchema,
  WebsocketRequestSchema,
} from './queries/Websocket.js';
export type { WebsocketDeleteQuerystring, WebsocketGetQuerystring } from './queries/Websocket.js';

// Data projection models
export type { AuthorizationRestrictions } from './projections/AuthorizationRestrictions.js';
export { default as AuthorizationRestrictionsSchema } from './projections/schemas/AuthorizationRestrictionsSchema.json' with { type: 'json' };
export { default as TariffSchema } from './projections/schemas/TariffSchema.json' with { type: 'json' };

// Date endpoints DTOs
export { GenerateCertificateChainRequest } from './dtos/GenerateCertificateChainRequest.js';
export { InstallRootCertificateRequest } from './dtos/InstallRootCertificateRequest.js';
export { TlsCertificatesRequest } from './dtos/TlsCertificatesRequest.js';
