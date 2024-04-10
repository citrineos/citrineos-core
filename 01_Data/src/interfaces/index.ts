// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export * from './repositories';

// Data endpoints query models
export { type ChargingStationKeyQuerystring, ChargingStationKeyQuerySchema } from './queries/ChargingStation';
export { type VariableAttributeQuerystring, VariableAttributeQuerySchema, type CreateOrUpdateVariableAttributeQuerystring, CreateOrUpdateVariableAttributeQuerySchema } from './queries/VariableAttribute';
export { type AuthorizationQuerystring, AuthorizationQuerySchema } from './queries/Authorization';
export { type TransactionEventQuerystring, TransactionEventQuerySchema } from './queries/TransactionEvent';

// Data projection models
export type { AuthorizationRestrictions } from './projections/AuthorizationRestrictions';
export { default as AuthorizationRestrictionsSchema } from './projections/schemas/AuthorizationRestrictionsSchema.json';
