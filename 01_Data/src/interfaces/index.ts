// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export * from './repositories';

// Data endpoints query models
export {
  ChargingStationKeyQuerystring,
  ChargingStationKeyQuerySchema,
} from './queries/ChargingStation';
export {
  UpdateChargingStationPasswordQueryString,
  UpdateChargingStationPasswordQuerySchema,
} from './queries/UpdateChargingStationPasswordQuery';
export {
  VariableAttributeQuerystring,
  VariableAttributeQuerySchema,
  CreateOrUpdateVariableAttributeQuerystring,
  CreateOrUpdateVariableAttributeQuerySchema,
} from './queries/VariableAttribute';
export { AuthorizationQuerystring, AuthorizationQuerySchema } from './queries/Authorization';
export {
  TransactionEventQuerystring,
  TransactionEventQuerySchema,
} from './queries/TransactionEvent';
export { TariffQueryString, TariffQuerySchema } from './queries/Tariff';
export { ModelKeyQuerystring, ModelKeyQuerystringSchema } from './queries/Model';
export {
  NetworkProfileQuerystring,
  NetworkProfileQuerySchema,
  NetworkProfileDeleteQuerystring,
  NetworkProfileDeleteQuerySchema,
} from './queries/NetworkProfile';
export {
  UpdateTlsCertificateQueryString,
  TlsCertificateSchema,
  UpdateTlsCertificateQuerySchema,
} from './queries/TlsCertificate';
export { TenantQuerySchema, TenantQueryString } from './queries/Tenant';
export {
  GenerateCertificateChainSchema,
  InstallRootCertificateSchema,
} from './queries/RootCertificate';
export { CreateSubscriptionSchema } from './queries/Subscription';
export {
  WebsocketGetQuerystring,
  WebsocketGetQuerySchema,
  WebsocketDeleteQuerystring,
  WebsocketDeleteQuerySchema,
  WebsocketRequestSchema,
} from './queries/Websocket';

// Data projection models
export { AuthorizationRestrictions } from './projections/AuthorizationRestrictions';
export { default as AuthorizationRestrictionsSchema } from './projections/schemas/AuthorizationRestrictionsSchema.json';
export { default as TariffSchema } from './projections/schemas/TariffSchema.json';

// Date endpoints DTOs
export { TlsCertificatesRequest } from './dtos/TlsCertificatesRequest';
export { GenerateCertificateChainRequest } from './dtos/GenerateCertificateChainRequest';
export { InstallRootCertificateRequest } from './dtos/InstallRootCertificateRequest';
