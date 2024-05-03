// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export * from './repositories';

// Data endpoints query models
export { ChargingStationKeyQuerystring, ChargingStationKeyQuerySchema } from './queries/ChargingStation';
export { VariableAttributeQuerystring, VariableAttributeQuerySchema, CreateOrUpdateVariableAttributeQuerystring, CreateOrUpdateVariableAttributeQuerySchema } from './queries/VariableAttribute';
export { AuthorizationQuerystring, AuthorizationQuerySchema } from './queries/Authorization';
export { TransactionEventQuerystring, TransactionEventQuerySchema } from './queries/TransactionEvent';
export { TariffQueryString, TariffQuerySchema, CreateOrUpdateTariffQuerySchema, CreateOrUpdateTariffQueryString } from './queries/Tariff';
export { ModelKeyQuerystring, ModelKeyQuerystringSchema } from './queries/Model';
export { UpdateTlsCertificateQueryString, TlsCertificateSchema, UpdateTlsCertificateQuerySchema } from './queries/TlsCertificate';
export { RootCertificateSchema } from './queries/RootCertificate';

// Data projection models
export { AuthorizationRestrictions } from './projections/AuthorizationRestrictions';
export { default as AuthorizationRestrictionsSchema } from './projections/schemas/AuthorizationRestrictionsSchema.json';
export { default as TariffSchema } from './projections/schemas/TariffSchema.json';

// Date endpoints DTOs
export { TlsCertificatesRequest, ContentType } from './dtos/TlsCertificatesRequest';
export { RootCertificateRequest } from './dtos/RootCertificateRequest';
