// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export { DefaultDrizzleInstance } from './util.js';
export { DrizzleRepository, type DrizzleRepositoryDependencies } from './repository/Base.js';
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
