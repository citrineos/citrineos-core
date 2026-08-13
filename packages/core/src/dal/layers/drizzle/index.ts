// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export { DefaultDrizzleInstance } from './util.js';
export { DrizzleRepository, type DrizzleRepositoryDependencies } from './repository/Base.js';
export { DrizzleAuthorizationRepository, toAuthorizationDto } from './repository/Authorization.js';
export {
  authorizationTable,
  tenantAuthorizationTable,
  AuthorizationEntitySchema,
  AuthorizationEntityInsertSchema,
  type AuthorizationEntity,
  type AuthorizationEntityInsert,
} from './schema/Authorization.js';
export { DrizzleSecurityEventRepository, toSecurityEventDto } from './repository/SecurityEvent.js';
export {
  securityEventTable,
  tenantSecurityEventTable,
  SecurityEventEntitySchema,
  SecurityEventEntityInsertSchema,
  type SecurityEventEntity,
  type SecurityEventEntityInsert,
} from './schema/SecurityEvent.js';
export { DrizzleSubscriptionRepository, toSubscriptionDto } from './repository/Subscription.js';
export {
  subscriptionTable,
  tenantSubscriptionTable,
  SubscriptionEntitySchema,
  SubscriptionEntityInsertSchema,
  type SubscriptionEntity,
  type SubscriptionEntityInsert,
} from './schema/Subscription.js';
export {
  DrizzleServerNetworkProfileRepository,
  toServerNetworkProfileDto,
} from './repository/ServerNetworkProfile.js';
export {
  serverNetworkProfileTable,
  tenantServerNetworkProfileTable,
  ServerNetworkProfileEntitySchema,
  ServerNetworkProfileEntityInsertSchema,
  type ServerNetworkProfileEntity,
  type ServerNetworkProfileEntityInsert,
} from './schema/ServerNetworkProfile.js';
export { DrizzleTenantRepository, toTenantDto } from './repository/Tenant.js';
export {
  tenantTable,
  tenantTenantTable,
  TenantEntitySchema,
  TenantEntityInsertSchema,
  type TenantEntity,
  type TenantEntityInsert,
} from './schema/Tenant.js';

// ─── Schema declarations & startup validation ────────────────────────────────

export { citext } from './schema/columnTypes.js';
/** Namespaced access to every drizzle table declaration; also the validator's input. */
export * as drizzleSchema from './schema/index.js';
export {
  formatDriftReport,
  normalizeSqlType,
  registeredTableNames,
  registeredTables,
  resolveValidationMode,
  SchemaDriftError,
  sqlTypesMatch,
  tableMap,
  validateDrizzleSchema,
  type RegisteredTable,
  type SchemaFinding,
  type SchemaFindingKind,
  type SchemaValidationMode,
  type ValidateSchemaOptions,
} from './validation/index.js';
