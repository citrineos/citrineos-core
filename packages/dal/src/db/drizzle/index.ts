// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export { DefaultDrizzleInstance } from './util.js';
export {
  DrizzleRepository,
  type DrizzleRepositoryDependencies,
} from '../../repositories/drizzle/base.js';
export {
  DrizzleAuthorizationRepository,
  toAuthorizationDto,
} from '../../repositories/drizzle/authorization.js';
export {
  authorizationTable,
  tenantAuthorizationTable,
  AuthorizationEntitySchema,
  AuthorizationEntityInsertSchema,
  type AuthorizationEntity,
  type AuthorizationEntityInsert,
} from './schema/authorization.js';
export { DrizzleBootRepository, toBootDto } from '../../repositories/drizzle/boot.js';
export {
  bootTable,
  tenantBootTable,
  BootEntitySchema,
  BootEntityInsertSchema,
  type BootEntity,
  type BootEntityInsert,
} from './schema/boot.js';
export {
  DrizzleCertificateRepository,
  toCertificateDto,
} from '../../repositories/drizzle/certificate.js';
export {
  certificateTable,
  tenantCertificateTable,
  CertificateEntitySchema,
  CertificateEntityInsertSchema,
  type CertificateEntity,
  type CertificateEntityInsert,
} from './schema/certificate.js';
export {
  DrizzleChangeConfigurationRepository,
  toChangeConfigurationDto,
} from '../../repositories/drizzle/change-configuration.js';
export {
  changeConfigurationTable,
  tenantChangeConfigurationTable,
  ChangeConfigurationEntitySchema,
  ChangeConfigurationEntityInsertSchema,
  type ChangeConfigurationEntity,
  type ChangeConfigurationEntityInsert,
} from './schema/change-configuration.js';
export {
  DrizzleDeleteCertificateAttemptRepository,
  toDeleteCertificateAttemptDto,
} from '../../repositories/drizzle/delete-certificate-attempt.js';
export {
  deleteCertificateAttemptTable,
  tenantDeleteCertificateAttemptTable,
  DeleteCertificateAttemptEntitySchema,
  DeleteCertificateAttemptEntityInsertSchema,
  type DeleteCertificateAttemptEntity,
  type DeleteCertificateAttemptEntityInsert,
} from './schema/delete-certificate-attempt.js';
export {
  DrizzleInstallCertificateAttemptRepository,
  toInstallCertificateAttemptDto,
} from '../../repositories/drizzle/install-certificate-attempt.js';
export {
  installCertificateAttemptTable,
  tenantInstallCertificateAttemptTable,
  InstallCertificateAttemptEntitySchema,
  InstallCertificateAttemptEntityInsertSchema,
  type InstallCertificateAttemptEntity,
  type InstallCertificateAttemptEntityInsert,
} from './schema/install-certificate-attempt.js';
export {
  DrizzleInstalledCertificateRepository,
  toInstalledCertificateDto,
} from '../../repositories/drizzle/installed-certificate.js';
export {
  installedCertificateTable,
  tenantInstalledCertificateTable,
  InstalledCertificateEntitySchema,
  InstalledCertificateEntityInsertSchema,
  type InstalledCertificateEntity,
  type InstalledCertificateEntityInsert,
} from './schema/installed-certificate.js';
export {
  DrizzleSecurityEventRepository,
  toSecurityEventDto,
} from '../../repositories/drizzle/security-event.js';
export {
  securityEventTable,
  tenantSecurityEventTable,
  SecurityEventEntitySchema,
  SecurityEventEntityInsertSchema,
  type SecurityEventEntity,
  type SecurityEventEntityInsert,
} from './schema/security-event.js';
export {
  DrizzleSubscriptionRepository,
  toSubscriptionDto,
} from '../../repositories/drizzle/subscription.js';
export {
  subscriptionTable,
  tenantSubscriptionTable,
  SubscriptionEntitySchema,
  SubscriptionEntityInsertSchema,
  type SubscriptionEntity,
  type SubscriptionEntityInsert,
} from './schema/subscription.js';
export {
  DrizzleServerNetworkProfileRepository,
  toServerNetworkProfileDto,
} from '../../repositories/drizzle/server-network-profile.js';
export {
  serverNetworkProfileTable,
  tenantServerNetworkProfileTable,
  ServerNetworkProfileEntitySchema,
  ServerNetworkProfileEntityInsertSchema,
  type ServerNetworkProfileEntity,
  type ServerNetworkProfileEntityInsert,
} from './schema/server-network-profile.js';
export { DrizzleTenantRepository, toTenantDto } from '../../repositories/drizzle/tenant.js';
export {
  tenantTable,
  tenantTenantTable,
  TenantEntitySchema,
  TenantEntityInsertSchema,
  type TenantEntity,
  type TenantEntityInsert,
} from './schema/tenant.js';
export {
  DrizzleVariableAttributeRepository,
  toVariableAttributeDto,
} from '../../repositories/drizzle/variable-attribute.js';
export {
  variableAttributeTable,
  tenantVariableAttributeTable,
  VariableAttributeEntitySchema,
  VariableAttributeEntityInsertSchema,
  type VariableAttributeEntity,
  type VariableAttributeEntityInsert,
} from './schema/variable-attribute.js';
