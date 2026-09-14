// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export * from '../repositories/repositories.js';

// Data endpoints query models
export { AuthorizationQuerySchema } from './queries/authorization.js';
export type { AuthorizationQuerystring } from './queries/authorization.js';
export { ChargingStationKeyQuerySchema } from './queries/charging-station.js';
export type { ChargingStationKeyQuerystring } from './queries/charging-station.js';
export { GenerateCertificateChainQuerySchema } from './queries/certificate-chain.js';
export type { GenerateCertificateChainQueryString } from './queries/certificate-chain.js';
export { ConnectionDeleteQuerySchema } from './queries/connection.js';
export type { ConnectionDeleteQuerystring } from './queries/connection.js';
export { ModelKeyQuerystringSchema } from './queries/model.js';
export type { ModelKeyQuerystring } from './queries/model.js';
export {
  NetworkProfileDeleteQuerySchema,
  NetworkProfileQuerySchema,
} from './queries/network-profile.js';
export type {
  NetworkProfileDeleteQuerystring,
  NetworkProfileQuerystring,
} from './queries/network-profile.js';
export {
  GenerateCertificateChainSchema,
  InstallRootCertificateSchema,
  RegenerateInstalledCertificateSchema,
  UploadExistingCertificateSchema,
} from './queries/root-certificate.js';
export { CreateSubscriptionSchema } from './queries/subscription.js';
export { TariffQuerySchema } from './queries/tariff.js';
export type { TariffQueryString } from './queries/tariff.js';
export { CreateTenantQuerySchema, TenantQuerySchema } from './queries/tenant.js';
export type { TenantQueryString } from './queries/tenant.js';
export { TlsReloadQuerySchema } from './queries/tls-reload.js';
export type { TlsReloadQueryString } from './queries/tls-reload.js';
export { UpdateChargingStationPasswordQuerySchema } from './queries/update-charging-station-password-query.js';
export type { UpdateChargingStationPasswordQueryString } from './queries/update-charging-station-password-query.js';
export { TransactionEventQuerySchema } from './queries/transaction-event.js';
export type { TransactionEventQuerystring } from './queries/transaction-event.js';
export {
  CreateOrUpdateVariableAttributeQuerySchema,
  VariableAttributeQuerySchema,
} from './queries/variable-attribute.js';
export type {
  CreateOrUpdateVariableAttributeQuerystring,
  VariableAttributeQuerystring,
} from './queries/variable-attribute.js';
export {
  WebsocketDeleteQuerySchema,
  WebsocketGetQuerySchema,
  WebsocketMappingDeleteQuerySchema,
  WebsocketMappingQuerySchema,
  WebsocketRequestSchema,
} from './queries/websocket.js';
export type {
  WebsocketDeleteQuerystring,
  WebsocketGetQuerystring,
  WebsocketMappingDeleteQuerystring,
  WebsocketMappingQuerystring,
} from './queries/websocket.js';

// Data projection models
export type { AuthorizationRestrictions } from './projections/authorization-restrictions.js';
export { default as AuthorizationRestrictionsSchema } from './projections/schemas/AuthorizationRestrictionsSchema.json' with { type: 'json' };
export { default as TariffSchema } from './projections/schemas/TariffSchema.json' with { type: 'json' };

// Date endpoints DTOs
export {
  CertificateGenerationScope,
  GenerateCertificateChainRequest,
} from './dtos/generate-certificate-chain-request.js';
export { InstallRootCertificateRequest } from './dtos/install-root-certificate-request.js';
export { RegenerateExistingCertificate } from './dtos/regenerate-existing-certificate.js';
export { UploadExistingCertificate } from './dtos/upload-existing-certificate.js';
