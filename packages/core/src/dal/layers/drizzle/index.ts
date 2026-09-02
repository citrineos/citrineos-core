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
  DrizzleDeleteCertificateAttemptRepository,
  toDeleteCertificateAttemptDto,
} from './repository/DeleteCertificateAttempt.js';
export {
  deleteCertificateAttemptTable,
  tenantDeleteCertificateAttemptTable,
  DeleteCertificateAttemptEntitySchema,
  DeleteCertificateAttemptEntityInsertSchema,
  type DeleteCertificateAttemptEntity,
  type DeleteCertificateAttemptEntityInsert,
} from './schema/DeleteCertificateAttempt.js';
export {
  DrizzleInstallCertificateAttemptRepository,
  toInstallCertificateAttemptDto,
} from './repository/InstallCertificateAttempt.js';
export {
  installCertificateAttemptTable,
  tenantInstallCertificateAttemptTable,
  InstallCertificateAttemptEntitySchema,
  InstallCertificateAttemptEntityInsertSchema,
  type InstallCertificateAttemptEntity,
  type InstallCertificateAttemptEntityInsert,
} from './schema/InstallCertificateAttempt.js';
export {
  DrizzleInstalledCertificateRepository,
  toInstalledCertificateDto,
} from './repository/InstalledCertificate.js';
export {
  installedCertificateTable,
  tenantInstalledCertificateTable,
  InstalledCertificateEntitySchema,
  InstalledCertificateEntityInsertSchema,
  type InstalledCertificateEntity,
  type InstalledCertificateEntityInsert,
} from './schema/InstalledCertificate.js';
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
export { DrizzleTariffRepository, toTariffDto } from './repository/Tariff.js';
export {
  tariffTable,
  tenantTariffTable,
  TariffEntitySchema,
  TariffEntityInsertSchema,
  type TariffEntity,
  type TariffEntityInsert,
} from './schema/Tariff.js';
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
