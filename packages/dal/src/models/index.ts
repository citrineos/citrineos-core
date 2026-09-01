// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Base models that don't have cross-dependencies
export { BaseModelWithTenant } from './base-model-with-tenant.js';
export { Boot } from './boot.js';
export { ChangeConfiguration } from './change-configuration.js';
export { OCPPMessage } from './ocpp-message.js';
export { Reservation } from './reservation.js';
export { SecurityEvent } from './security-event.js';
export { Tenant } from './tenant.js';
export { TenantPartner } from './tenant-partner.js';
export { ChargingStationSecurityInfo } from './charging-station-security-info.js';

// Domain-specific models - these must be imported directly to avoid circular dependencies
// NOTE: The following domains have circular dependencies and must be imported directly:
//
// Location domain:
// export * from './location/index.js';
// - ChargingStation, Location, Evse, Connector, etc.
//
// Certificate domain:
// export * from './certificate/index.js';
// - Certificate, InstalledCertificate, InstallCertificateAttempt, DeleteCertificateAttempt
//
// Authorization domain:
// export * from './authorization/index.js';
// - Authorization, LocalList*, SendLocalList, etc.
//
// DeviceModel domain:
// export * from './device-model/index.js';
// - Component, Variable, VariableAttribute, etc.
//
// TransactionEvent domain:
// export * from './transaction-event/index.js';
// - Transaction, TransactionEvent, MeterValue, etc.
//
// ChargingProfile domain:
// export * from './charging-profile/index.js';
// - ChargingProfile, ChargingSchedule, etc.
//
// Other domains:
// export * from './async-job/index.js';
// export * from './message-info/index.js';
// export * from './subscription/index.js';
// export * from './tariff/index.js';
// export * from './variable-monitoring/index.js';
// export * from './charging-station-sequence/index.js';

// Use direct imports for models with circular dependencies:
// import { ChargingStation } from './location/charging-station.js';
// import { Certificate } from './certificate/certificate.js';
// etc.
