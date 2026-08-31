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
export { DrizzleBootRepository, toBootDto } from './repository/Boot.js';
export {
  bootTable,
  tenantBootTable,
  BootEntitySchema,
  BootEntityInsertSchema,
  type BootEntity,
  type BootEntityInsert,
} from './schema/Boot.js';
export { DrizzleCertificateRepository, toCertificateDto } from './repository/Certificate.js';
export {
  certificateTable,
  tenantCertificateTable,
  CertificateEntitySchema,
  CertificateEntityInsertSchema,
  type CertificateEntity,
  type CertificateEntityInsert,
} from './schema/Certificate.js';
export {
  DrizzleChangeConfigurationRepository,
  toChangeConfigurationDto,
} from './repository/ChangeConfiguration.js';
export {
  changeConfigurationTable,
  tenantChangeConfigurationTable,
  ChangeConfigurationEntitySchema,
  ChangeConfigurationEntityInsertSchema,
  type ChangeConfigurationEntity,
  type ChangeConfigurationEntityInsert,
} from './schema/ChangeConfiguration.js';
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
export {
  DrizzleVariableAttributeRepository,
  toVariableAttributeDto,
} from './repository/VariableAttribute.js';
export {
  variableAttributeTable,
  tenantVariableAttributeTable,
  VariableAttributeEntitySchema,
  VariableAttributeEntityInsertSchema,
  type VariableAttributeEntity,
  type VariableAttributeEntityInsert,
} from './schema/VariableAttribute.js';
