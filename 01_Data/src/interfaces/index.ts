// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export * from './repositories.js';

// Data endpoints query models
export {
  ChargingStationKeyQuerystring,
  ChargingStationKeyQuerySchema,
} from './queries/ChargingStation.js';
export {
  UpdateChargingStationPasswordQueryString,
  UpdateChargingStationPasswordQuerySchema,
} from './queries/UpdateChargingStationPasswordQuery.js';
export {
  VariableAttributeQuerystring,
  VariableAttributeQuerySchema,
  CreateOrUpdateVariableAttributeQuerystring,
  CreateOrUpdateVariableAttributeQuerySchema,
} from './queries/VariableAttribute.js';
export { AuthorizationQuerystring, AuthorizationQuerySchema } from './queries/Authorization.js';
export {
  TransactionEventQuerystring,
  TransactionEventQuerySchema,
} from './queries/TransactionEvent.js';
export { TariffQueryString, TariffQuerySchema } from './queries/Tariff.js';
export { ModelKeyQuerystring, ModelKeyQuerystringSchema } from './queries/Model.js';
export {
  NetworkProfileQuerystring,
  NetworkProfileQuerySchema,
  NetworkProfileDeleteQuerystring,
  NetworkProfileDeleteQuerySchema,
} from './queries/NetworkProfile.js';
export {
  UpdateTlsCertificateQueryString,
  TlsCertificateSchema,
  UpdateTlsCertificateQuerySchema,
} from './queries/TlsCertificate.js';
export { TenantQuerySchema, TenantQueryString } from './queries/Tenant.js';
export {
  GenerateCertificateChainSchema,
  InstallRootCertificateSchema,
} from './queries/RootCertificate.js';
export { CreateSubscriptionSchema } from './queries/Subscription.js';
export {
  WebsocketGetQuerystring,
  WebsocketGetQuerySchema,
  WebsocketDeleteQuerystring,
  WebsocketDeleteQuerySchema,
  WebsocketRequestSchema,
} from './queries/Websocket.js';

// Data projection models
export { AuthorizationRestrictions } from './projections/AuthorizationRestrictions.js';
export { default as AuthorizationRestrictionsSchema } from './projections/schemas/AuthorizationRestrictionsSchema.json' with { type: 'json' };
export { default as TariffSchema } from './projections/schemas/TariffSchema.json' with { type: 'json' };

// Date endpoints DTOs
export { TlsCertificatesRequest } from './dtos/TlsCertificatesRequest.js';
export { GenerateCertificateChainRequest } from './dtos/GenerateCertificateChainRequest.js';
export { InstallRootCertificateRequest } from './dtos/InstallRootCertificateRequest.js';
